param([string]$ReleaseDirectory='')
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
if(-not $ReleaseDirectory){$ReleaseDirectory=Join-Path $root 'release'}
$project=Get-Content -LiteralPath (Join-Path $root 'project.json') -Encoding UTF8 -Raw | ConvertFrom-Json
$manifest=Get-Content -LiteralPath (Join-Path $ReleaseDirectory 'release-manifest.json') -Encoding UTF8 -Raw | ConvertFrom-Json
if($manifest.version -ne $project.version){throw 'Release version mismatch.'}
Add-Type -AssemblyName System.IO.Compression.FileSystem
foreach($artifact in $manifest.files){
    $path=Join-Path $ReleaseDirectory $artifact.file
    if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash -ne $artifact.sha256){throw 'ZIP hash mismatch.'}
    $source=$artifact.file -like '*-source.zip'
    $prefix=if($source){'Codex-Silver-Startup-'+$project.version+'-source/'}else{'Codex-Silver-Startup-'+$project.version+'-windows-x64/'}
    $files=if($source){@($project.sourceFiles)}else{@($project.runtimeFiles)+@('启动 Codex.exe','图片与动画设置.exe')}
    $expected=@($files | ForEach-Object {$prefix+$_.Replace('\','/')})
    $zip=[IO.Compression.ZipFile]::OpenRead($path)
    try{
        $actual=@($zip.Entries | ForEach-Object {$_.FullName})
        if($actual.Count -ne $expected.Count -or @(Compare-Object ($actual | Sort-Object) ($expected | Sort-Object)).Count){throw 'ZIP file set does not match the explicit manifest.'}
        foreach($entry in $zip.Entries){
            if($entry.FullName -match '(^|/)(state|review|verification|\.audit|\.build|\.git|\.local-backup|Cookies|Local State|Login Data)(/|$)' -or $entry.FullName -match '(^|/)(validation\.md|launcher\.log|browser-check\.json)$'){throw 'Local data or a development record entered release.'}
            if($entry.LastWriteTime.DateTime -ne [DateTime]::new(2000,1,1)){throw 'ZIP entry retains an original file timestamp.'}
            if($entry.FullName -match '\.(ps1|cs|js|mjs|html|css|json|md|txt)$'){
                $reader=[IO.StreamReader]::new($entry.Open(),[Text.Encoding]::UTF8,$true)
                try{$text=$reader.ReadToEnd()}finally{$reader.Dispose()}
                if($text -match '(?i)[A-Z]:[\\/]+Users[\\/]+' -or $text -match '-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----' -or $text -match '(github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|sk-(proj-|svcacct-)?[A-Za-z0-9_-]{24,})' -or $text -match 'eyJ[A-Za-z0-9_-]{12,}\.eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}' -or $text -match 'S-1-5-21-\d{5,}-\d{5,}-\d{5,}-\d+'){throw ('Private path or credential pattern in '+$entry.FullName)}
            }
        }
    }finally{$zip.Dispose()}
    Write-Output ('PASS: '+$artifact.file+'; '+$expected.Count+' reviewed files; hash and local-data checks.')
}
