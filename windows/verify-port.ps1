param([Parameter(Mandatory=$true)][ValidateRange(1,65535)][int]$Port)
$ErrorActionPreference='Stop'
Add-Type -Path (Join-Path $PSScriptRoot 'Activation.cs')
$records=@(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop | ForEach-Object {
    $listener=$_
    $ownerProcess=Get-CimInstance Win32_Process -Filter ('ProcessId='+$listener.OwningProcess)
    if($null -eq $ownerProcess){throw 'Listener process disappeared'}
    $owner=Invoke-CimMethod -InputObject $ownerProcess -MethodName GetOwnerSid
    if($owner.ReturnValue -ne 0){throw 'Cannot verify listener user'}
    [pscustomobject]@{pid=[int]$ownerProcess.ProcessId;parentPid=[int]$ownerProcess.ParentProcessId;address=$listener.LocalAddress;executable=$ownerProcess.ExecutablePath;sid=$owner.Sid;packageFullName=[PackageStartup]::PackageName([uint32]$ownerProcess.ProcessId)}
})
ConvertTo-Json -InputObject $records -Compress
