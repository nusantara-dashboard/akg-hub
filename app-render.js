/**
 * DYNAMIC FORM LAYOUT GENERATOR ENGINE
 * Berfungsi menarik header dari Google Sheets dan menggambar isian form secara otomatis.
 */

function subAktifkanDinamisKas() {
  var target = document.getElementById("sheetTargetKas").value; 
  var wadah = document.getElementById("zonaInputDinamisKas"); 
  var slot = document.getElementById("slotUploadFileKas");
  wadah.innerHTML = "Memuat kolom cloud..."; slot.style.display = "none";
  
  panggilServerBackend({ aksi: "GET_HEADERS", namaSheet: target }, function(res) {
    wadah.innerHTML = ""; 
    res.headers.forEach(h => {
      if(h.isAuto || ["timestamp","petugas","operator","waktu"].some(el => h.name.toLowerCase().includes(el))) return;
      if(h.isUpload) { slot.style.display = "block"; return; }
      var div = document.createElement("div"); div.className = "mb-3"; div.innerHTML = `<label class="form-label small fw-bold">${h.name}</label>`;
      var low = h.name.toLowerCase();
      if(low.includes("kategori") && !low.includes("sub")) { div.appendChild(subDrawSelectHtml(h.name, kamusMaster.kategori)); }
      else if(low.includes("sub kategori")) { div.appendChild(subDrawSelectHtml(h.name, kamusMaster.subKategori)); }
      else if(low.includes("rekening") || low.includes("metode")) { div.appendChild(subDrawSelectHtml(h.name, kamusMaster.rekening)); }
      else if(low.includes("outlet")) { div.appendChild(subDrawSelectHtml(h.name, kamusMaster.outlet)); }
      else if(low.includes("proyek")) { div.appendChild(subDrawSelectHtml(h.name, kamusMaster.proyek)); }
      else {
        var ip = document.createElement("input"); ip.name = h.name; ip.className = "form-control input-kas-field"; ip.required = true;
        if(low.includes("tanggal")) { ip.type = "date"; }
        else if(["debit","kredit","nominal","jumlah"].some(el => low.includes(el))) { ip.type = "text"; ip.value = "Rp 0"; ip.onkeyup = function() { this.value = formatRupiahTyping(this.value.replace(/[^0-9]/g, '')); }; }
        else { ip.type = "text"; ip.placeholder = "Isi " + h.name; } div.appendChild(ip);
      } wadah.appendChild(div);
    });
  });
}

function subAktifkanDinamisGudang() {
  var wadah = document.getElementById("zonaInputGudang"); wadah.innerHTML = "Memuat struktur gudang...";
  panggilServerBackend({ aksi: "GET_HEADERS", namaSheet: "Master_Inventory" }, function(res) {
    wadah.innerHTML = ""; res.headers.forEach(h => {
      if(h.isAuto || ["timestamp","petugas","operator","waktu"].some(el => h.name.toLowerCase().includes(el))) return;
      var div = document.createElement("div"); div.className = "mb-3"; div.innerHTML = `<label class="form-label small fw-bold">${h.name}</label>`;
      var low = h.name.toLowerCase();
      if(low.includes("barang") || low.includes("sku")) { var s = document.createElement("select"); s.name = h.name; s.className = "form-select input-gudang-field"; s.required = true; s.innerHTML = '<option value="">-- Pilih Barang --</option>'; kamusMaster.inventory.forEach(i => s.innerHTML += `<option value="${i}">${i}</option>`); div.appendChild(s); }
      else if(low.includes("tipe") || low.includes("alur")) { var s = document.createElement("select"); s.name = h.name; s.className = "form-select input-gudang-field"; s.required = true; s.innerHTML = '<option value="">-- Alur --</option><option value="Stok Masuk">Stok Masuk</option><option value="Stok Keluar">Stok Keluar</option>'; div.appendChild(s); }
      else { var ip = document.createElement("input"); ip.name = h.name; ip.className = "form-control input-gudang-field"; ip.required = true; ip.type = (low.includes("qty")||low.includes("jumlah"))?"number":"text"; div.appendChild(ip); } wadah.appendChild(div);
    });
  });
}

function subAktifkanDinamisProyek() {
  var wadah = document.getElementById("zonaInputProyek"); wadah.innerHTML = "Memuat struktur proyek...";
  panggilServerBackend({ aksi: "GET_HEADERS", namaSheet: "Master_Proyek" }, function(res) {
    wadah.innerHTML = ""; res.headers.forEach(h => {
      if(h.isAuto || ["timestamp","petugas","operator","waktu"].some(el => h.name.toLowerCase().includes(el))) return;
      var div = document.createElement("div"); div.className = "mb-3"; div.innerHTML = `<label class="form-label small fw-bold">${h.name}</label>`;
      var low = h.name.toLowerCase();
      if(low.includes("proyek") || low.includes("pengadaan")) { var s = document.createElement("select"); s.name = h.name; s.className = "form-select input-proyek-field"; s.required = true; s.innerHTML = '<option value="">-- Pilih Proyek --</option>'; kamusMaster.proyek.forEach(p => s.innerHTML += `<option value="${p}">${p}</option>`); div.appendChild(s); }
      else { var ip = document.createElement("input"); ip.name = h.name; ip.className = "form-control input-proyek-field"; ip.required = true; if(low.includes("tanggal")) { ip.type = "date"; } else if(["nilai","budget","nominal"].some(el => low.includes(el))) { ip.type = "text"; ip.value = "Rp 0"; ip.onkeyup = function() { this.value = formatRupiahTyping(this.value.replace(/[^0-9]/g, '')); }; } else { ip.type = "text"; ip.placeholder = "Isi " + h.name; } div.appendChild(ip); } wadah.appendChild(div);
    });
  });
}
/**
 * TRANSACTION DISPATCHER & UI FUNCTIONAL ENGINE
 * Mengolah konfirmasi Bootstrap Modal, auto kompresi foto, integrasi WhatsApp API, dan kalender gulir.
 */

function pemicuReviewModal(tipeAksi) {
  targetKirimAksiDinamis = tipeAksi; var txt = "";
  if(tipeAksi === "KAS") { document.querySelectorAll(".input-kas-field").forEach(ip => txt += `${ip.name} : ${ip.value}\n`); }
  else if(tipeAksi === "KASIR") { txt += `Tanggal : ${document.getElementById("ksrTgl").value}\nOutlet : ${document.getElementById("ksrOutlet").value}\nPelanggan : ${document.getElementById("ksrCust").value}\nWhatsApp : +62 ${document.getElementById("ksrWa").value}\nItem : ${document.getElementById("ksrBarang").value}\nQty : ${document.getElementById("ksrQty").value} Pcs\nTotal : ${document.getElementById("ksrTotal").value}\n`; }
  else if(tipeAksi === "GUDANG") { document.querySelectorAll(".input-gudang-field").forEach(ip => txt += `${ip.name} : ${ip.value}\n`); }
  else if(tipeAksi === "PROYEK") { document.querySelectorAll(".input-proyek-field").forEach(ip => txt += `${ip.name} : ${ip.value}\n`); }
  document.getElementById("isiKandunganModalReview").innerText = txt;
  document.getElementById("btnKonfirmasiModalSetuju").onclick = eksekusiKirimFinalMenujuCloud;
  bootstrapModalInstance.show();
}

async function eksekusiKirimFinalMenujuCloud() {
  bootstrapModalInstance.hide(); var tipe = targetKirimAksiDinamis; var payload = { aksi: "SIMPAN_TRANSAKSI", petugasUser: profilUser.nama };
  var fInput = null, txtId = "", formId = "", cb;
  if(tipe === "KAS") {
    payload.namaSheet = document.getElementById("sheetTargetKas").value; txtId = "alertKas"; formId = "formKirimKas"; cb = subAktifkanDinamisKas;
    document.querySelectorAll(".input-kas-field").forEach(ip => payload[ip.name] = ip.value.includes("Rp") ? ip.value.replace(/[^0-9]/g, '') : ip.value); fInput = document.getElementById("fileFotoKas");
  } else if(tipe === "KASIR") {
    payload.namaSheet = "Jurnal_Umum"; txtId = "alertKasir"; formId = "formKasir"; cb = function(){ document.getElementById("slotWaStruk").style.display = "block"; };
    payload["Tanggal"] = document.getElementById("ksrTgl").value; payload["Kontak (Cust/Supl)"] = document.getElementById("ksrCust").value;
    payload["Keterangan"] = `Kasir Outlet: ${document.getElementById("ksrBarang").value} (${document.getElementById("ksrQty").value} Pcs)`;
    payload["Outlet"] = document.getElementById("ksrOutlet").value; payload["Kategori (COA)"] = "Pendapatan Usaha"; payload["Sub Kategori"] = "Penjualan Toko";
    payload["Metode Bayar / Rekening"] = "Cash / Tunai"; payload["Debit (Masuk)"] = document.getElementById("ksrTotal").value.replace(/[^0-9]/g, ''); payload["Kredit (Keluar)"] = 0;
  } else if(tipe === "GUDANG") {
    payload.namaSheet = "Master_Inventory"; txtId = "alertGudang"; formId = "formGudang"; cb = subAktifkanDinamisGudang;
    document.querySelectorAll(".input-gudang-field").forEach(ip => payload[ip.name] = ip.value);
  } else if(tipe === "PROYEK") {
    payload.namaSheet = "Master_Proyek"; txtId = "alertProyek"; formId = "formProyek"; cb = subAktifkanDinamisProyek;
    document.querySelectorAll(".input-proyek-field").forEach(ip => payload[ip.name] = ip.value.includes("Rp") ? ip.value.replace(/[^0-9]/g, '') : ip.value);
  }
  var sDiv = document.getElementById(txtId); sDiv.innerText = "⏳ Menyimpan transaksi..."; var file = fInput && fInput.files ? fInput.files : null;
  var limit = parseFloat(kamusMaster.configs["MAX_IMAGE_SIZE_MB"]) || 1;
  if(file) {
    if(file.size > (limit*1024*1024)) { file = await imageCompression(file, { maxSizeMB: limit-0.1, maxWidthOrHeight: 1200, useWebWorker: true }); }
    var reader = new FileReader(); reader.onload = function(e) { payload.fileData = e.target.result; payload.fileName = "bukti.jpg"; panggilServerBackend(payload, function(res){ sDiv.innerText = "✅ " + res.pesan; if(tipe!=="KASIR") document.getElementById(formId).reset(); cb(); }); }; reader.readAsDataURL(file);
  } else { panggilServerBackend(payload, function(res){ sDiv.innerText = "✅ " + res.pesan; if(tipe!=="KASIR") document.getElementById(formId).reset(); cb(); }); }
}

function subMemicuUpdateKalenderGulir() {
  var d1 = document.getElementById("scrTglMulai").value, m1 = document.getElementById("scrBlnMulai").value, y1 = document.getElementById("scrThnMulai").value;
  var d2 = document.getElementById("scrTglSelesai").value, m2 = document.getElementById("scrBlnSelesai").value, y2 = document.getElementById("scrThnSelesai").value;
  subAmbilAngkaDashboard(`${y1}-${m1}-${d1}`, `${y2}-${m2}-${d2}`);
}

function subAmbilAngkaDashboard(tglMulaiDefault, tglSelesaiDefault) {
  var m = tglMulaiDefault || "2026-01-01"; var s = tglSelesaiDefault || "2026-12-31"; var b = document.getElementById("tabelLaporanBodi"); b.innerHTML = '<tr><td colspan="4" class="text-center">Sinkronisasi data...</td></tr>';
  panggilServerBackend({ aksi: "GET_DASHBOARD", mulai: m, selesai: s }, function(res) {
    document.getElementById("boxKas").innerText = "Rp " + res.totalKas.toLocaleString('id-ID'); document.getElementById("boxPiutang").innerText = "Rp " + res.totalPiutang.toLocaleString('id-ID'); document.getElementById("boxHutang").innerText = "Rp " + res.totalHutang.toLocaleString('id-ID'); b.innerHTML = "";
    res.daftarHP.forEach(i => { var badge = i.status === "LUNAS" ? '<span class="badge bg-success">LUNAS</span>' : '<span class="badge bg-danger">BELUM LUNAS</span>'; b.innerHTML += `<tr><td>${i.nama}</td><td>${(i.sisaPiutang||0).toLocaleString('id-ID')}</td><td>${(i.sisaHutang||0).toLocaleString('id-ID')}</td><td class="text-center">${badge}</td></tr>`; });
  });
}

function kirimNotaPaperlessWaEngine() {
  var wa = document.getElementById("ksrWa").value; var txt = window.encodeURIComponent(`*STRUK DIGITAL PENJUALAN*\nTanggal: ${document.getElementById("ksrTgl").value}\nOutlet: ${document.getElementById("ksrOutlet").value}\nPelanggan: ${document.getElementById("ksrCust").value}\n-----------------------\nItem: ${document.getElementById("ksrBarang").value} (${document.getElementById("ksrQty").value} Pcs)\n*TOTAL OMSET: ${document.getElementById("ksrTotal").value}*\n-----------------------\nStatus: LUNAS\nTerima kasih! 🙏`);
  window.open(`https://whatsapp.com{wa}&text=${txt}`, '_blank'); document.getElementById("formKasir").reset(); document.getElementById("slotWaStruk").style.display = "none";
}
