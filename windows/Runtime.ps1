# Resolve application identity and signed Node runtimes at their owning boundary.
function Resolve-CodexRuntime {
    $package=Get-AppxPackage -Name 'OpenAI.Codex' | Sort-Object Version -Descending | Select-Object -First 1
    if(-not $package -or $package.SignatureKind -ne 'Store' -or $package.Publisher -ne 'CN=50BDFD77-8903-4850-9FFE-6E8522F64D5B') {
        throw 'No verified official Microsoft Store Codex package is installed.'
    }
    $manifest=Get-AppxPackageManifest -Package $package.PackageFullName
    $apps=@($manifest.Package.Applications.Application | Where-Object {$_.Executable -match '(^|[/\\])ChatGPT\.exe$'})
    if($apps.Count -ne 1){throw 'The official application manifest has no unique desktop entry.'}
    $executable=[IO.Path]::GetFullPath((Join-Path $package.InstallLocation $apps[0].Executable))
    $signature=Get-AuthenticodeSignature -LiteralPath $executable
    if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.GetNameInfo([Security.Cryptography.X509Certificates.X509NameType]::SimpleName,$false) -ne 'OpenAI OpCo, LLC'){
        throw 'Official desktop executable signature verification failed.'
    }
    $candidates=New-Object System.Collections.Generic.List[string]
    $candidates.Add((Join-Path $package.InstallLocation 'app/resources/cua_node/bin/node.exe'))
    $runtimeRoot=Join-Path $env:LOCALAPPDATA 'OpenAI/Codex/runtimes/cua_node'
    if(Test-Path -LiteralPath $runtimeRoot){
        Get-ChildItem -LiteralPath $runtimeRoot -Directory | Sort-Object LastWriteTimeUtc -Descending | ForEach-Object {
            if(-not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint)){$candidates.Add((Join-Path $_.FullName 'bin/node.exe'))}
        }
    }
    $candidates.Add((Join-Path $env:LOCALAPPDATA 'OpenAI/Codex/bin/node.exe'))
    $node=$null
    foreach($candidate in $candidates){
        if(-not(Test-Path -LiteralPath $candidate -PathType Leaf)){continue}
        $signed=Get-AuthenticodeSignature -LiteralPath $candidate
        if($signed.Status -ne 'Valid' -or $signed.SignerCertificate.GetNameInfo([Security.Cryptography.X509Certificates.X509NameType]::SimpleName,$false) -ne 'OpenAI OpCo, LLC'){continue}
        $capabilities=& $candidate -p 'JSON.stringify({major:Number(process.versions.node.split(String.fromCharCode(46))[0]),fetch:typeof fetch,websocket:typeof WebSocket})'
        if($LASTEXITCODE -ne 0){continue}
        try{$facts=$capabilities | ConvertFrom-Json}catch{continue}
        if($facts.major -ge 22 -and $facts.fetch -eq 'function' -and $facts.websocket -eq 'function'){$node=$candidate;break}
    }
    if(-not $node){throw 'No signed OpenAI Node runtime with fetch and WebSocket support was found. Open the official app once to finish runtime setup.'}
    [pscustomobject]@{Package=$package;Executable=$executable;Node=$node;ApplicationId=($package.PackageFamilyName+'!'+$apps[0].Id)}
}
