param([string]$ProfileDirectory='', [switch]$NoDialog, [switch]$OpenSettings, [switch]$CheckOnly)
$ErrorActionPreference='Stop'
$env:PSModulePath=(Join-Path $PSHOME 'Modules')+[IO.Path]::PathSeparator+(Join-Path $env:ProgramFiles 'WindowsPowerShell/Modules')
$root=Split-Path $PSScriptRoot -Parent
if($ProfileDirectory){$ProfileDirectory=[IO.Path]::GetFullPath($ProfileDirectory)}
$logDirectory=Join-Path $root 'state'
if($ProfileDirectory){$logDirectory=Join-Path $logDirectory 'diagnostic'}
New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
$logFile=Join-Path $logDirectory 'launcher.log'
$lock=[Threading.Mutex]::new($false,('Local\CodexSilverStartupPublic'+$(if($ProfileDirectory){'Diagnostic'}else{'Main'})))
$locked=$false
function Write-Log([string]$text){Add-Content -LiteralPath $logFile -Value ((Get-Date -Format s)+' '+$text) -Encoding UTF8}
try{
    try{$locked=$lock.WaitOne(0)}catch [Threading.AbandonedMutexException]{$locked=$true}
    if(-not $locked){exit 0}
    . (Join-Path $PSScriptRoot 'Runtime.ps1')
    $runtime=Resolve-CodexRuntime
    $package=$runtime.Package;$executable=$runtime.Executable;$node=$runtime.Node
    if($CheckOnly){[pscustomobject]@{Version=[string]$package.Version;ApplicationId=$runtime.ApplicationId;Executable=$executable;Node=$node} | ConvertTo-Json;exit 0}
    $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $processes=@(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" | Where-Object {$_.ExecutablePath -eq $executable -and $_.CommandLine -notmatch '--type='})
    $existing=$processes | Where-Object {
        if($ProfileDirectory){$_.CommandLine -like ('*'+$ProfileDirectory+'*')}
        else{$_.CommandLine -notmatch '--user-data-dir='}
    } | Where-Object {(Invoke-CimMethod -InputObject $_ -MethodName GetOwnerSid).Sid -eq $sid} | Select-Object -First 1
    if($existing){
        if($OpenSettings){
            $sessionPath=Join-Path $logDirectory 'session.json'
            $session=$null
            try{$session=Get-Content -LiteralPath $sessionPath -Raw -ErrorAction Stop | ConvertFrom-Json}catch{}
            if(-not $session -or $session.pid -ne $existing.ProcessId -or $session.packageFullName -ne $package.PackageFullName -or $session.port -lt 1 -or $session.port -gt 65535){throw 'Codex 正在运行，但本次未从动画入口启动。请保存工作，在菜单或托盘中彻底退出 Codex，再打开「图片与动画设置」。'}
            $result=& $node (Join-Path $root 'extension\windows.mjs') --port $session.port --pid $existing.ProcessId --exe $executable --sid $sid --package $package.PackageFullName --settings 2>&1
            $settingsExit=$LASTEXITCODE
            foreach($line in $result){Write-Log ([string]$line)}
            if($settingsExit -ne 0){throw ('设置打开失败：'+($result -join [Environment]::NewLine))}
            if(-not $ProfileDirectory){Add-Type -Path (Join-Path $PSScriptRoot 'Activation.cs');[PackageStartup]::Launch($runtime.ApplicationId,'') | Out-Null}
            exit 0
        }
        Add-Type -Path (Join-Path $PSScriptRoot 'Activation.cs')
        $activatedPid=[PackageStartup]::Launch($runtime.ApplicationId,'')
        Write-Log ('Existing official window activated; pid='+$existing.ProcessId)
        exit 0
    }
    $portListener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
    $portListener.Start();$port=$portListener.LocalEndpoint.Port;$portListener.Stop()
    $arguments='--remote-debugging-address=127.0.0.1 --remote-debugging-port='+$port
    if($ProfileDirectory){
        $profilePath=[IO.Path]::GetFullPath($ProfileDirectory)
        $arguments+=' --user-data-dir="'+$profilePath+'" --no-first-run'
    }
    Add-Type -Path (Join-Path $PSScriptRoot 'Activation.cs')
    $officialPid=[PackageStartup]::Launch($runtime.ApplicationId,$arguments)
    @{pid=$officialPid;port=$port;packageFullName=$package.PackageFullName} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $logDirectory 'session.json') -Encoding UTF8
    Write-Log ('Launching official app with MSIX identity; pid='+$officialPid+'; port='+$port+'; package='+$package.Version)
    $nodeArgs=@((Join-Path $root 'extension\windows.mjs'),'--port',[string]$port,'--pid',[string]$officialPid,'--exe',$executable,'--sid',$sid,'--package',$package.PackageFullName)
    if($OpenSettings){$nodeArgs+='--settings'}
    $result=& $node @nodeArgs 2>&1
    $exitCode=$LASTEXITCODE
    foreach($line in $result){Write-Log ([string]$line)}
    if($exitCode -ne 0){throw ('动画接入失败。'+[Environment]::NewLine+($result -join [Environment]::NewLine))}
}catch{
    Write-Log ('ERROR: '+$_.Exception.Message)
    if(-not $NoDialog){
        Add-Type -AssemblyName System.Windows.Forms
        [Windows.Forms.MessageBox]::Show(($_.Exception.Message+[Environment]::NewLine+[Environment]::NewLine+'官方安装包未修改。请完全退出后从官方图标重新打开。'+[Environment]::NewLine+'日志：'+$logFile),'Codex 启动动画',[Windows.Forms.MessageBoxButtons]::OK,[Windows.Forms.MessageBoxIcon]::Warning) | Out-Null
    }
    exit 1
}finally{if($locked){$lock.ReleaseMutex()};$lock.Dispose()}
