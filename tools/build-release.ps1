param([string]$OutputDirectory='')
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
$project=Get-Content -LiteralPath (Join-Path $root 'project.json') -Encoding UTF8 -Raw | ConvertFrom-Json
if($project.version -notmatch '^\d+\.\d+\.\d+$'){throw 'project.json has an invalid version.'}
if(-not $OutputDirectory){$OutputDirectory=Join-Path $root 'release'}
$output=[IO.Path]::GetFullPath($OutputDirectory)
$name='Codex-Silver-Startup-'+$project.version+'-windows-x64'
$portable=Join-Path $output $name
$portableZip=Join-Path $output ($name+'.zip')
$sourceZip=Join-Path $output ('Codex-Silver-Startup-'+$project.version+'-source.zip')
foreach($target in @($portable,$portableZip,$sourceZip)){
    if(Test-Path -LiteralPath $target){throw ('Build destination already exists. Choose another OutputDirectory: '+$target)}
}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if(-not(Test-Path -LiteralPath $compiler -PathType Leaf)){throw 'Windows x64 and .NET Framework 4.x are required to build.'}

function Project-File([string]$relative){
    if([IO.Path]::IsPathRooted($relative)){throw 'Manifest entries must be relative.'}
    $path=[IO.Path]::GetFullPath((Join-Path $root $relative))
    if(-not $path.StartsWith($root+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Manifest entry leaves project root.'}
    $item=Get-Item -LiteralPath $path
    if($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw ('Expected a normal project file: '+$relative)}
    return $path
}
foreach($file in @($project.runtimeFiles)+@($project.sourceFiles)){[void](Project-File $file)}

New-Item -ItemType Directory -Path $output -Force | Out-Null
$staging=Join-Path $root ('.build/release-'+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging -Force | Out-Null
foreach($file in $project.runtimeFiles){
    $target=Join-Path $staging $file
    New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
    Copy-Item -LiteralPath (Project-File $file) -Destination $target
}
$launcherSource=Project-File 'windows/Launcher.cs'
$common=@('/nologo','/codepage:65001','/target:winexe','/optimize+','/reference:System.Windows.Forms.dll',('/win32icon:'+(Project-File 'assets/windows-codex.ico')))
& $compiler @common ('/out:'+(Join-Path $staging 'Start Codex.exe')) $launcherSource
if($LASTEXITCODE -ne 0){throw 'Failed to build startup entry.'}
& $compiler @common /define:SETTINGS_ENTRY ('/out:'+(Join-Path $staging 'Animation Settings.exe')) $launcherSource
if($LASTEXITCODE -ne 0){throw 'Failed to build settings entry.'}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Write-Zip([string]$base,[string[]]$files,[string]$path,[string]$prefix){
    $stream=[IO.File]::Open($path,[IO.FileMode]::CreateNew)
    try{
        $archive=[IO.Compression.ZipArchive]::new($stream,[IO.Compression.ZipArchiveMode]::Create,$true)
        try{
            foreach($file in $files){
                $entry=($prefix+'/'+$file.Replace('\','/')).TrimStart('/')
                $created=$archive.CreateEntry($entry,[IO.Compression.CompressionLevel]::Optimal)
                $created.LastWriteTime=[DateTimeOffset]::new(2000,1,1,0,0,0,[TimeSpan]::Zero)
                $inputStream=[IO.File]::OpenRead((Join-Path $base $file))
                try{
                    $entryStream=$created.Open()
                    try{$inputStream.CopyTo($entryStream)}finally{$entryStream.Dispose()}
                }finally{$inputStream.Dispose()}
            }
        }finally{$archive.Dispose()}
    }finally{$stream.Dispose()}
}
$runtimeFiles=@($project.runtimeFiles)+@('Start Codex.exe','Animation Settings.exe')
Write-Zip $staging $runtimeFiles $portableZip $name
Write-Zip $root @($project.sourceFiles) $sourceZip ('Codex-Silver-Startup-'+$project.version+'-source')

# Copy only the known runtime files, never an existing app/state or browser profile.
New-Item -ItemType Directory -Path $portable | Out-Null
foreach($file in $runtimeFiles){
    $target=Join-Path $portable $file
    New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $staging $file) -Destination $target
}
$artifacts=@($portableZip,$sourceZip | ForEach-Object {
    $item=Get-Item -LiteralPath $_
    [ordered]@{file=$item.Name;bytes=$item.Length;sha256=(Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}
})
$artifacts | ForEach-Object {$_.sha256+'  '+$_.file} | Set-Content -LiteralPath (Join-Path $output 'SHA256SUMS.txt') -Encoding UTF8
[ordered]@{name=$project.name;version=$project.version;platform='windows-x64';signed=$false;files=$artifacts} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output 'release-manifest.json') -Encoding UTF8
# This generated directory is owned by this invocation. Resolve and verify it
# before cleanup; never recurse into the project root or a redirected directory.
$buildRoot=[IO.Path]::GetFullPath((Join-Path $root '.build'))
$resolvedStaging=(Resolve-Path -LiteralPath $staging).ProviderPath
$stagingItem=Get-Item -LiteralPath $resolvedStaging
$buildItem=Get-Item -LiteralPath $buildRoot
if(-not $resolvedStaging.StartsWith($buildRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -or (Split-Path $resolvedStaging -Leaf) -notmatch '^release-[0-9a-f]{32}$' -or ($stagingItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -or ($buildItem.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unsafe staging cleanup target.'}
Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
if(@(Get-ChildItem -LiteralPath $buildRoot -Force).Count -eq 0){Remove-Item -LiteralPath $buildRoot}
Write-Output ('Portable folder: '+$portable)
Write-Output ('Portable ZIP: '+$portableZip)
Write-Output ('Source ZIP: '+$sourceZip)
