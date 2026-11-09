# 빵지 가계부 저장소(main)의 모든 .md 파일을 내 PC 폴더로 받아 덮어쓰기
# 사용: powershell -ExecutionPolicy Bypass -File sync-md.ps1 -Target "D:\황지영\Claude"
param([Parameter(Mandatory = $true)][string]$Target)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repo = 'zi02zi0/jy-budget'
$branch = 'main'
$log = Join-Path $PSScriptRoot 'sync-md.log'
try {
  $tree = Invoke-RestMethod "https://api.github.com/repos/$repo/git/trees/${branch}?recursive=1" -Headers @{ 'User-Agent' = 'bbangji-md-sync' } -UseBasicParsing
  New-Item -ItemType Directory -Force -Path $Target | Out-Null
  $files = @($tree.tree | Where-Object { $_.type -eq 'blob' -and $_.path -like '*.md' })
  foreach ($f in $files) {
    $dest = Join-Path $Target ($f.path -replace '/', '\')
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    $urlPath = ($f.path -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    Invoke-WebRequest "https://raw.githubusercontent.com/$repo/$branch/$urlPath" -OutFile $dest -UseBasicParsing
  }
  "$(Get-Date -Format s) OK $($files.Count)개: $(($files | ForEach-Object { $_.path }) -join ', ')" | Set-Content -Path $log -Encoding UTF8
} catch {
  "$(Get-Date -Format s) 실패: $($_.Exception.Message)" | Set-Content -Path $log -Encoding UTF8
  exit 1
}
