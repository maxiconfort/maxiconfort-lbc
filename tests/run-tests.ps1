# Lance les 2 harnais du moteur sur plusieurs dates de reference.
# Un test qui passe un jour et echoue le lendemain n'est pas un garde-fou :
# l'horloge est donc figee, et on verifie que le resultat est IDENTIQUE
# quelle que soit la date simulee.
#
# Usage :  .\tests\run-tests.ps1
#          .\tests\run-tests.ps1 -Dates '2026-09-15','2027-01-01'
#
# NB : fichier volontairement en ASCII pur (PowerShell 5.1 lit les .ps1 en ANSI,
# un caractere accentue sans BOM casse l'analyse du script).

param([string[]]$Dates = @('2026-09-15', '2026-10-01', '2026-11-20', '2027-02-28'))

Set-Location (Split-Path $PSScriptRoot -Parent)
$echecs = 0
$lignes = @()

foreach ($h in @('test_v46.js', 'test_v47.js')) {
  foreach ($d in $Dates) {
    $sortie = node "tests\$h" $d 2>&1
    $res = ($sortie | Select-String -Pattern 'sultat :').ToString()
    if ($res -notmatch '/ 0 KO') {
      $echecs++
      $lignes += "  ECHEC  $h  $d  ->  $res"
      $lignes += ($sortie | Select-String -Pattern 'x ' | ForEach-Object { "         $_" })
    } else {
      $lignes += "  ok     $h  $d  ->  $res"
    }
  }
}

$lignes
""
if ($echecs -eq 0) {
  "TOUS LES TESTS PASSENT sur $($Dates.Count) dates de reference (resultat deterministe)."
  exit 0
} else {
  "$echecs execution(s) en echec, voir ci-dessus."
  exit 1
}
