package handler

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"
)

type ImportHandler struct {
	DB *pgxpool.Pool
}

const (
	importSheetName   = "Data Pendaftar"
	importGuideSheet  = "Petunjuk"
	importRefSheet    = "Referensi"
	importMaxFileSize = 10 << 20 // 10 MB
	importMaxErrors   = 100      // batas error yang dikembalikan ke frontend
)

// Kolom wajib: Nama, NIM, Kelas, WhatsApp, Tanggal Lahir, Program Studi, Divisi 1.
// Kolom opsional: Divisi 2, Status, Tanggal Pendaftaran.
var importHeaders = []string{"Nama", "NIM", "Kelas", "WhatsApp", "Tanggal Lahir", "Program Studi", "Divisi 1", "Divisi 2", "Status", "Tanggal Pendaftaran"}
var importRequiredHeaders = []string{"Nama", "NIM", "Kelas", "WhatsApp", "Tanggal Lahir", "Program Studi", "Divisi 1"}

// normHeader menormalisasi nama header: buang BOM, trim, lower.
// Dipakai juga untuk nama/kode prodi, nama divisi, dan label status.
func normHeader(s string) string {
	return strings.ToLower(strings.TrimSpace(strings.TrimPrefix(s, "\uFEFF")))
}

// normalizeImportStatus memetakan label Indonesia/Inggris ke enum selection_status.
func normalizeImportStatus(v string) (string, bool) {
	switch normHeader(v) {
	case "":
		return "PENDING", true
	case "pending", "menunggu":
		return "PENDING", true
	case "accepted", "diterima":
		return "ACCEPTED", true
	case "rejected", "ditolak":
		return "REJECTED", true
	}
	return "", false
}

// aturan sama dengan public_handler.go: 8-20 karakter, hanya digit/+/spasi/dash
func validImportWhatsApp(s string) bool {
	if len(s) < 8 || len(s) > 20 {
		return false
	}
	for _, r := range s {
		if !(r >= '0' && r <= '9' || r == '+' || r == '-' || r == ' ') {
			return false
		}
	}
	return true
}

var importDateLayouts = []string{
	"02/01/2006 15:04:05",
	"02/01/2006 15:04",
	"2006-01-02 15:04:05",
	"2006-01-02 15:04",
	"2006-01-02T15:04:05",
	"02/01/2006",
	"2006-01-02",
	"02-01-2006",
	"2/1/2006",
}

// parseImportDate menerima layout di atas (time.Local) dengan fallback angka Excel serial.
func parseImportDate(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, false
	}
	for _, layout := range importDateLayouts {
		if t, err := time.ParseInLocation(layout, s, time.Local); err == nil {
			return t, true
		}
	}
	if n, err := strconv.ParseFloat(s, 64); err == nil {
		if t, err := excelize.ExcelDateToTime(n, false); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

// cellAt mengambil sel dengan aman (baris Excel bisa lebih pendek dari header).
func cellAt(row []string, idx int) string {
	if idx < 0 || idx >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[idx])
}

// GET /admin/import/applicants/template
func (h *ImportHandler) DownloadTemplate(c *gin.Context) {
	type prodiRef struct{ name, code string }
	var prodis []prodiRef

	prows, err := h.DB.Query(c, `SELECT name, COALESCE(code,'') FROM program_studies WHERE deleted_at IS NULL ORDER BY name`)
	if err != nil {
		log.Printf("ERROR: failed to load program studies: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	for prows.Next() {
		var p prodiRef
		if err := prows.Scan(&p.name, &p.code); err != nil {
			prows.Close()
			log.Printf("ERROR: failed to scan program study: %v", err)
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		prodis = append(prodis, p)
	}
	prows.Close()
	if err := prows.Err(); err != nil {
		log.Printf("ERROR: failed to read program studies: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	var divisi []string
	drows, err := h.DB.Query(c, `SELECT name FROM divisions WHERE deleted_at IS NULL ORDER BY name`)
	if err != nil {
		log.Printf("ERROR: failed to load divisions: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	for drows.Next() {
		var name string
		if err := drows.Scan(&name); err != nil {
			drows.Close()
			log.Printf("ERROR: failed to scan division: %v", err)
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		divisi = append(divisi, name)
	}
	drows.Close()
	if err := drows.Err(); err != nil {
		log.Printf("ERROR: failed to read divisions: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	f := excelize.NewFile()
	defer f.Close()

	if err := f.SetSheetName("Sheet1", importSheetName); err != nil {
		log.Printf("ERROR: failed to rename sheet: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	for i, header := range importHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(importSheetName, cell, header)
	}
	f.SetCellStyle(importSheetName, "A1", "J1", headerStyle)
	f.SetPanes(importSheetName, &excelize.Panes{Freeze: true, XSplit: 0, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomRight"})
	f.SetColWidth(importSheetName, "A", "J", 25)

	// Sheet referensi (tersembunyi) untuk dropdown.
	if _, err := f.NewSheet(importRefSheet); err != nil {
		log.Printf("ERROR: failed to create reference sheet: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	for i, p := range prodis {
		f.SetCellValue(importRefSheet, fmt.Sprintf("A%d", i+2), p.name)
	}
	for i, d := range divisi {
		f.SetCellValue(importRefSheet, fmt.Sprintf("B%d", i+2), d)
	}
	f.SetSheetVisible(importRefSheet, false)

	// Sheet petunjuk.
	if _, err := f.NewSheet(importGuideSheet); err != nil {
		log.Printf("ERROR: failed to create guide sheet: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	guideLines := []string{
		"PETUNJUK IMPORT DATA PENDAFTAR",
		"",
		"Kolom wajib: Nama, NIM, Kelas, WhatsApp, Tanggal Lahir, Program Studi, Divisi 1.",
		"Kolom opsional: Divisi 2, Status, Tanggal Pendaftaran.",
		"Format tanggal: DD/MM/YYYY (contoh 31/12/2006).",
		"Status: PENDING/Menunggu, ACCEPTED/Diterima, REJECTED/Ditolak. Kosong = PENDING.",
		"Divisi 2 boleh dikosongkan; bila diisi harus berbeda dari Divisi 1.",
		"NIM yang sudah terdaftar pada periode tujuan (atau duplikat di file ini) akan dilewati.",
		"",
		"Contoh pengisian (bukan baris data):",
		"Budi Santoso | 2210512345 | TI-3A | 081234567890 | 31/12/2006 | Teknik Informatika | Pengembangan | | PENDING | 01/09/2026",
	}
	for i, line := range guideLines {
		f.SetCellValue(importGuideSheet, fmt.Sprintf("A%d", i+2), line)
	}

	// Data validation.
	statusDV := excelize.NewDataValidation(true)
	statusDV.Sqref = "I2:I1000"
	statusDV.SetDropList([]string{"PENDING", "ACCEPTED", "REJECTED"})
	if err := f.AddDataValidation(importSheetName, statusDV); err != nil {
		log.Printf("ERROR: failed to add status validation: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	if len(prodis) > 0 {
		dv := excelize.NewDataValidation(true)
		dv.Sqref = "F2:F1000"
		dv.SetSqrefDropList(fmt.Sprintf("%s!$A$2:$A$%d", importRefSheet, len(prodis)+1))
		if err := f.AddDataValidation(importSheetName, dv); err != nil {
			log.Printf("ERROR: failed to add prodi validation: %v", err)
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
	}

	if len(divisi) > 0 {
		end := len(divisi) + 1
		for _, sqref := range []string{"G2:G1000", "H2:H1000"} {
			dv := excelize.NewDataValidation(true)
			dv.Sqref = sqref
			dv.SetSqrefDropList(fmt.Sprintf("%s!$B$2:$B$%d", importRefSheet, end))
			if err := f.AddDataValidation(importSheetName, dv); err != nil {
				log.Printf("ERROR: failed to add division validation: %v", err)
				respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
				return
			}
		}
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		log.Printf("ERROR: failed to write template: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Format_Import_Pendaftar.xlsx"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// POST /admin/import/applicants (multipart/form-data)
func (h *ImportHandler) ImportApplicants(c *gin.Context) {
	periodID := strings.TrimSpace(c.PostForm("registration_period_id"))
	if periodID == "" {
		respondError(c, http.StatusUnprocessableEntity, "Periode pendaftaran wajib dipilih.", "VALIDATION_ERROR")
		return
	}

	var periodExists bool
	if err := h.DB.QueryRow(c, `SELECT EXISTS(SELECT 1 FROM registration_periods WHERE id=$1)`, periodID).Scan(&periodExists); err != nil {
		log.Printf("ERROR: failed to check registration period: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	if !periodExists {
		respondError(c, http.StatusUnprocessableEntity, "Periode pendaftaran tidak ditemukan.", "INVALID_REGISTRATION_PERIOD")
		return
	}

	fh, err := c.FormFile("file")
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "File import wajib diunggah.", "VALIDATION_ERROR")
		return
	}
	if fh.Size > importMaxFileSize {
		respondError(c, http.StatusUnprocessableEntity, "Ukuran file maksimal 10 MB.", "FILE_TOO_LARGE")
		return
	}
	if strings.ToLower(filepath.Ext(fh.Filename)) != ".xlsx" {
		respondError(c, http.StatusUnprocessableEntity, "Format file harus .xlsx.", "INVALID_FILE")
		return
	}

	src, err := fh.Open()
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "File tidak dapat dibaca.", "INVALID_FILE")
		return
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		respondError(c, http.StatusUnprocessableEntity, "File tidak dapat dibaca.", "INVALID_FILE")
		return
	}
	defer f.Close()

	sheet := ""
	sheetList := f.GetSheetList()
	for _, s := range sheetList {
		if s == importSheetName {
			sheet = s
			break
		}
	}
	if sheet == "" && len(sheetList) > 0 {
		sheet = sheetList[0]
	}

	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) == 0 {
		respondError(c, http.StatusUnprocessableEntity, "File tidak memiliki data.", "EMPTY_FILE")
		return
	}

	colIdx := map[string]int{}
	for i, header := range rows[0] {
		name := normHeader(header)
		if name == "" {
			continue
		}
		if _, ok := colIdx[name]; !ok {
			colIdx[name] = i
		}
	}
	var missing []string
	for _, req := range importRequiredHeaders {
		if _, ok := colIdx[normHeader(req)]; !ok {
			missing = append(missing, req)
		}
	}
	if len(missing) > 0 {
		respondError(c, http.StatusUnprocessableEntity, "Kolom wajib tidak ditemukan: "+strings.Join(missing, ", "), "INVALID_TEMPLATE")
		return
	}

	col := func(header string) int {
		if v, ok := colIdx[normHeader(header)]; ok {
			return v
		}
		return -1
	}
	get := func(row []string, header string) string {
		return cellAt(row, col(header))
	}

	prodiByName := map[string]string{}
	prows, err := h.DB.Query(c, `SELECT id, name, COALESCE(code,'') FROM program_studies WHERE deleted_at IS NULL`)
	if err != nil {
		log.Printf("ERROR: failed to load program studies: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	for prows.Next() {
		var id, name, code string
		if err := prows.Scan(&id, &name, &code); err != nil {
			prows.Close()
			log.Printf("ERROR: failed to scan program study: %v", err)
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		prodiByName[normHeader(name)] = id
		if code != "" {
			prodiByName[normHeader(code)] = id
		}
	}
	prows.Close()
	if err := prows.Err(); err != nil {
		log.Printf("ERROR: failed to read program studies: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	divByID := map[string]string{}
	drows, err := h.DB.Query(c, `SELECT id, name FROM divisions WHERE deleted_at IS NULL`)
	if err != nil {
		log.Printf("ERROR: failed to load divisions: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	for drows.Next() {
		var id, name string
		if err := drows.Scan(&id, &name); err != nil {
			drows.Close()
			log.Printf("ERROR: failed to scan division: %v", err)
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		divByID[normHeader(name)] = id
	}
	drows.Close()
	if err := drows.Err(); err != nil {
		log.Printf("ERROR: failed to read divisions: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	existingNIM := map[string]bool{}
	nrows, err := h.DB.Query(c, `SELECT nim FROM applicants WHERE registration_period_id=$1`, periodID)
	if err != nil {
		log.Printf("ERROR: failed to load existing NIM: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	for nrows.Next() {
		var nim string
		if err := nrows.Scan(&nim); err != nil {
			nrows.Close()
			log.Printf("ERROR: failed to scan existing NIM: %v", err)
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		existingNIM[nim] = true
	}
	nrows.Close()
	if err := nrows.Err(); err != nil {
		log.Printf("ERROR: failed to read existing NIM: %v", err)
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	const insertSQL = `INSERT INTO applicants
		(registration_period_id, program_study_id, name, nim, class, whatsapp, birth_date,
		 division_1_id, division_2_id, selection_status, created_at, updated_at)
	 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::selection_status,$11,$11)`

	created, skipped, failed, total := 0, 0, 0, 0
	seenNIM := map[string]bool{}
	errs := []gin.H{}

	for i, row := range rows[1:] {
		excelRow := i + 2

		blank := true
		for _, cell := range row {
			if strings.TrimSpace(cell) != "" {
				blank = false
				break
			}
		}
		if blank {
			continue
		}
		total++

		name := get(row, "Nama")
		nim := get(row, "NIM")
		class := get(row, "Kelas")
		whatsapp := get(row, "WhatsApp")
		birthRaw := get(row, "Tanggal Lahir")
		prodiRaw := get(row, "Program Studi")
		div1Raw := get(row, "Divisi 1")
		div2Raw := get(row, "Divisi 2")
		statusRaw := get(row, "Status")
		regRaw := get(row, "Tanggal Pendaftaran")

		var rowErrs []string
		if name == "" {
			rowErrs = append(rowErrs, "Nama wajib diisi.")
		}
		if nim == "" {
			rowErrs = append(rowErrs, "NIM wajib diisi.")
		}
		if class == "" {
			rowErrs = append(rowErrs, "Kelas wajib diisi.")
		}
		if whatsapp == "" {
			rowErrs = append(rowErrs, "WhatsApp wajib diisi.")
		} else if !validImportWhatsApp(whatsapp) {
			rowErrs = append(rowErrs, "Nomor WhatsApp tidak valid.")
		}

		var birth time.Time
		if birthRaw == "" {
			rowErrs = append(rowErrs, "Tanggal lahir wajib diisi.")
		} else if b, ok := parseImportDate(birthRaw); !ok || b.After(time.Now()) {
			rowErrs = append(rowErrs, "Tanggal lahir tidak valid.")
		} else {
			birth = b
		}

		prodiID := ""
		if prodiRaw == "" {
			rowErrs = append(rowErrs, "Program Studi wajib diisi.")
		} else if id, ok := prodiByName[normHeader(prodiRaw)]; ok {
			prodiID = id
		} else {
			rowErrs = append(rowErrs, "Program Studi tidak ditemukan: "+prodiRaw)
		}

		div1ID := ""
		if div1Raw == "" {
			rowErrs = append(rowErrs, "Divisi 1 wajib diisi.")
		} else if id, ok := divByID[normHeader(div1Raw)]; ok {
			div1ID = id
		} else {
			rowErrs = append(rowErrs, "Divisi 1 tidak ditemukan: "+div1Raw)
		}

		var div2 any
		if div2Raw != "" {
			if id, ok := divByID[normHeader(div2Raw)]; ok {
				if id == div1ID {
					rowErrs = append(rowErrs, "Divisi 2 tidak boleh sama dengan Divisi 1.")
				} else {
					div2 = id
				}
			} else {
				rowErrs = append(rowErrs, "Divisi 2 tidak ditemukan: "+div2Raw)
			}
		}

		status := "PENDING"
		if statusRaw != "" {
			if s, ok := normalizeImportStatus(statusRaw); ok {
				status = s
			} else {
				rowErrs = append(rowErrs, "Status tidak valid: "+statusRaw)
			}
		}

		regAt := time.Now()
		if regRaw != "" {
			if t, ok := parseImportDate(regRaw); ok {
				regAt = t
			} else {
				rowErrs = append(rowErrs, "Tanggal pendaftaran tidak valid.")
			}
		}

		if len(rowErrs) > 0 {
			failed++
			errs = append(errs, gin.H{"row": excelRow, "nim": nim, "message": strings.Join(rowErrs, " ")})
			continue
		}

		if existingNIM[nim] || seenNIM[nim] {
			skipped++
			errs = append(errs, gin.H{"row": excelRow, "nim": nim, "message": "NIM sudah terdaftar di periode ini."})
			seenNIM[nim] = true
			continue
		}
		seenNIM[nim] = true

		if _, err := h.DB.Exec(c, insertSQL, periodID, prodiID, name, nim, class, whatsapp, birth, div1ID, div2, status, regAt); err != nil {
			failed++
			msg := "Gagal menyimpan: " + err.Error()
			if isUniqueViolation(err) {
				msg = "NIM sudah terdaftar di periode ini."
			}
			errs = append(errs, gin.H{"row": excelRow, "nim": nim, "message": msg})
			continue
		}
		created++
	}

	truncated := false
	if len(errs) > importMaxErrors {
		errs = errs[:importMaxErrors]
		truncated = true
	}

	respondSuccess(c, http.StatusOK, "Import selesai.", gin.H{
		"total": total, "created": created, "skipped": skipped, "failed": failed,
		"errors": errs, "errors_truncated": truncated,
	})
}
