package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/xuri/excelize/v2"

	"himatris-oprec-backend/internal/config"
)

type ExportHandler struct {
	DB  *pgxpool.Pool
	Cfg *config.Config
}

// GET /admin/export/applicants
func (h *ExportHandler) ExportApplicants(c *gin.Context) {
	// filter opsional (sama seperti list applicants, tanpa pagination)
	where := []string{"1=1"}
	var args []any
	// cast dipakai untuk kolom enum supaya parameter yang dibandingkan juga
	// bertipe enum, sehingga index selection_status tetap terpakai.
	addFilter := func(col, val, cast string) {
		args = append(args, val)
		where = append(where, fmt.Sprintf("%s = $%d%s", col, len(args), cast))
	}
	if v := c.Query("registration_period_id"); v != "" {
		addFilter("a.registration_period_id", v, "")
	}
	if v := c.Query("program_study_id"); v != "" {
		addFilter("a.program_study_id", v, "")
	}
	if v := c.Query("division_id"); v != "" {
		args = append(args, v)
		p := len(args)
		where = append(where, fmt.Sprintf("(a.division_1_id = $%d OR a.division_2_id = $%d)", p, p))
	}
	if v := strings.TrimSpace(c.Query("status")); v != "" {
		addFilter("a.selection_status", v, "::selection_status")
	}

	// Satu baris per file (CV/POSTER/PORTFOLIO/PARENTAL_CONSENT) via subquery; agregasi jadi satu sel per jenis.
	// Yang diambil hanya path relatifnya, dan itu pun cuma sebagai penanda
	// berkasnya ada: tautan di sheet diarahkan ke halaman detail pendaftar di
	// panel admin, karena berkas pendaftar tidak lagi disajikan publik.
	query := `SELECT a.id, a.name, a.nim, a.class, COALESCE(a.whatsapp, ''), COALESCE(TO_CHAR(a.birth_date, 'DD/MM/YYYY'), ''), ps.name, d1.name,
		COALESCE(d2.name, ''),
		COALESCE((SELECT string_agg(f.path, ', ') FROM files f
			JOIN applicants a2 ON a2.id = f.applicant_id WHERE a2.id = a.id AND f.file_type = 'CV'), ''),
		COALESCE((SELECT string_agg(f.path, ', ') FROM files f
			JOIN applicants a2 ON a2.id = f.applicant_id WHERE a2.id = a.id AND f.file_type = 'POSTER'), ''),
		COALESCE((SELECT string_agg(f.path, ', ') FROM files f
			JOIN applicants a2 ON a2.id = f.applicant_id WHERE a2.id = a.id AND f.file_type = 'PORTFOLIO'), ''),
		COALESCE((SELECT string_agg(f.path, ', ') FROM files f
			JOIN applicants a2 ON a2.id = f.applicant_id WHERE a2.id = a.id AND f.file_type = 'PARENTAL_CONSENT'), ''),
		a.selection_status::text, a.created_at
		FROM applicants a
		JOIN program_studies ps ON ps.id = a.program_study_id
		JOIN divisions d1 ON d1.id = a.division_1_id
		LEFT JOIN divisions d2 ON d2.id = a.division_2_id
		WHERE ` + strings.Join(where, " AND ") +
		` ORDER BY a.created_at`

	rows, err := h.DB.Query(c, query, args...)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	defer rows.Close()

	type row struct {
		id, name, nim, class, whatsapp, birth, prodi, div1, div2, cv, poster, portfolio, parentalConsent, status string
		createdAt                                                                                                time.Time
	}
	var data []row
	total, pending, accepted, rejected := 0, 0, 0, 0
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.id, &r.name, &r.nim, &r.class, &r.whatsapp, &r.birth, &r.prodi, &r.div1, &r.div2,
			&r.cv, &r.poster, &r.portfolio, &r.parentalConsent, &r.status, &r.createdAt); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
		total++
		switch r.status {
		case "PENDING":
			pending++
		case "ACCEPTED":
			accepted++
		case "REJECTED":
			rejected++
		}
		data = append(data, r)
	}
	if err := rows.Err(); err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	f := excelize.NewFile()
	defer f.Close()

	// Sheet 1: Data Pendaftar
	headers := []string{"No", "Nama", "NIM", "Kelas", "WhatsApp", "Tanggal Lahir", "Program Studi", "Divisi 1", "Divisi 2",
		"CV", "Poster", "Portofolio", "Surat Persetujuan", "Status", "Tanggal Pendaftaran"}
	sheetNames := []string{"Data Pendaftar", "Statistik", "Rekap Prodi", "Rekap Divisi"}

	// Rename default sheet to first name
	if err := f.SetSheetName("Sheet1", sheetNames[0]); err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}

	// Create remaining sheets
	for i := 1; i < len(sheetNames); i++ {
		if _, err := f.NewSheet(sheetNames[i]); err != nil {
			respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
			return
		}
	}
	sheet := "Data Pendaftar"
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}
	statusLabel := map[string]string{"PENDING": "Menunggu", "ACCEPTED": "Diterima", "REJECTED": "Ditolak"}
	linkStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Color: "2563EB", Underline: "single"}})
	cellName := func(col, row int) string {
		name, _ := excelize.CoordinatesToCellName(col, row)
		return name
	}
	for i, r := range data {
		rowNo := i + 2
		f.SetCellInt(sheet, cellName(1, rowNo), int64(i+1))
		// Teks dari pendaftar ditulis sebagai string, bukan lewat SetCellValue:
		// excelize memperlakukan string yang diawali "=" sebagai rumus, sehingga
		// nama seperti "=1+1" akan dijalankan Excel saat file ekspor dibuka.
		for j, v := range []string{r.name, r.nim, r.class, r.whatsapp, r.birth, r.prodi, r.div1, r.div2} {
			f.SetCellStr(sheet, cellName(j+2, rowNo), v)
		}
		f.SetCellStr(sheet, cellName(14, rowNo), statusLabel[r.status])
		f.SetCellStr(sheet, cellName(15, rowNo), r.createdAt.Format("02/01/2006 15:04"))

		// Kolom CV(J), Poster(K), Portofolio(L), Surat Persetujuan(M): tautan ke
		// halaman detail pendaftar di panel admin. Tautan langsung ke berkas
		// tidak dipakai lagi karena berkas pendaftar hanya bisa diunduh dengan
		// token admin, bukan dari URL publik.
		detailURL := h.Cfg.FrontendURL + "/admin/applicants/" + r.id
		for j, ada := range []string{r.cv, r.poster, r.portfolio, r.parentalConsent} {
			if ada == "" {
				continue
			}
			cell := cellName(j+10, rowNo)
			f.SetCellFormula(sheet, cell, fmt.Sprintf("HYPERLINK(%q, %q)", detailURL, "Lihat File"))
			f.SetCellStyle(sheet, cell, cell, linkStyle)
		}
	}
	f.AddTable(sheet, &excelize.Table{Range: fmt.Sprintf("A1:O%d", len(data)+1), Name: "DataPendaftar"})

	// Sheet 2: Statistik
	sheet = "Statistik"
	statRows := [][2]any{{"Total Pendaftar", total}, {"Pending", pending}, {"Accepted", accepted}, {"Rejected", rejected}}
	for i, r := range statRows {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", i+1), r[0])
		f.SetCellValue(sheet, fmt.Sprintf("B%d", i+1), r[1])
	}

	// Sheet 3: Rekap Prodi
	sheet = "Rekap Prodi"
	f.SetCellValue(sheet, "A1", "Program Studi")
	f.SetCellValue(sheet, "B1", "Total")
	prodiCount := map[string]int{}
	var prodiOrder []string
	for _, r := range data {
		if _, ok := prodiCount[r.prodi]; !ok {
			prodiOrder = append(prodiOrder, r.prodi)
		}
		prodiCount[r.prodi]++
	}
	for i, p := range prodiOrder {
		f.SetCellStr(sheet, fmt.Sprintf("A%d", i+2), p)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", i+2), prodiCount[p])
	}

	// Sheet 4: Rekap Divisi (jumlah pilihan: div1 + div2)
	sheet = "Rekap Divisi"
	f.SetCellValue(sheet, "A1", "Divisi")
	f.SetCellValue(sheet, "B1", "Total")
	divCount := map[string]int{}
	var divOrder []string
	for _, r := range data {
		for _, d := range []string{r.div1, r.div2} {
			if d == "" {
				continue
			}
			if _, ok := divCount[d]; !ok {
				divOrder = append(divOrder, d)
			}
			divCount[d]++
		}
	}
	for i, d := range divOrder {
		f.SetCellStr(sheet, fmt.Sprintf("A%d", i+2), d)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", i+2), divCount[d])
	}

	// formatting: header bold + freeze + width
	for _, s := range sheetNames {
		style, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true},
		})
		endCol := "O"
		if s != "Data Pendaftar" {
			endCol = "B"
		}
		f.SetCellStyle(s, "A1", endCol+"1", style)
		f.SetPanes(s, &excelize.Panes{Freeze: true, XSplit: 0, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomRight"})
		f.SetColWidth(s, "A", "C", 20)
		if s == "Data Pendaftar" {
			f.SetColWidth(s, "D", "O", 25)
		}
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "Terjadi kesalahan.", "INTERNAL_SERVER_ERROR")
		return
	}
	filename := fmt.Sprintf("HIMATRIS_OPREC_%s.xlsx", time.Now().Format("2006"))
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
