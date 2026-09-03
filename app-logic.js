/**
 * BACKEND API CONNECTOR & AUTHENTICATION ENGINE
 * Mengatur jalannya pengiriman data lintas server via Fetch REST, Sesi Login, & Navigasi RBAC.
 */

var kamusMaster = {}; var profilUser = {}; var bootstrapModalInstance; var targetKirimAksiDinamis = null;
document.addEventListener("DOMContentLoaded", function() { bootstrapModalInstance = new bootstrap.Modal(document.getElementById('modalKonfirmasiPortal')); });

function panggilServerBackend(payloadData, callbackSukses) {
  fetch(WEB_API_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(payloadData) })
  .then(response => response.json()).then(res => callbackSukses(res)).catch(err => { alert("Koneksi Cloud Eror: " + err.toString()); });
}

function eksekusiLoginPortalGitHub() {
  var noHp = document.getElementById("logNoHp").value; var rawPin = document.getElementById("logPin").value;
  if(!noHp || !rawPin) { document.getElementById("loginAlert").innerText = "Isi nomor HP dan PIN!"; return; }
  var pinHash = CryptoJS.SHA256(rawPin).toString(CryptoJS.enc.Hex);
  panggilServerBackend({ aksi: "LOGIN", noHp: "62" + noHp, pin: pinHash }, function(res) {
    if(res.status === "SUKSES") {
      profilUser = res; document.getElementById("loginArea").style.display = "none"; document.getElementById("workspaceArea").style.display = "block";
      document.getElementById("userNama").innerText = res.nama; document.getElementById("userLevel").innerText = res.level;
      document.getElementById("btnNav_5").style.display = "block";
      var lvl = res.level;
      if (["Owner", "Management", "Admin"].includes(lvl)) { ["1","2","3","4","6"].forEach(i => document.getElementById("btnNav_" + i).style.display = "block"); bukaHalamanMenu(6); }
      else if (lvl === "Kasir") { document.getElementById("btnNav_2").style.display = "block"; bukaHalamanMenu(2); }
      else { ["1","3","4"].forEach(i => document.getElementById("btnNav_" + i).style.display = "block"); bukaHalamanMenu(1); }
      panggilServerBackend({ aksi: "GET_MASTER_DATA" }, function(m) { kamusMaster = m; });
    } else { document.getElementById("loginAlert").innerText = res.pesan; }
  });
}

function subDrawSelectHtml(name, arr) {
  var s = document.createElement("select"); s.name = name; s.className = "form-select input-kas-field"; s.required = true;
  s.innerHTML = `<option value="">-- Pilih ${name} --</option>`;
  arr.forEach(x => { s.innerHTML += `<option value="${x}">${x}</option>`; });
  return s;
}
