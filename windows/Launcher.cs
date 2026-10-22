using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
static class Launcher {
 [STAThread] static int Main(string[] args) {
  try {
   string root=AppDomain.CurrentDomain.BaseDirectory;
   string script=Path.Combine(root,"windows","launch.ps1");
   if(!File.Exists(script))throw new FileNotFoundException("启动文件不完整，请保留整个文件夹。",script);
   var info=new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","powershell.exe"));
   info.Arguments="-NoProfile -NonInteractive -ExecutionPolicy RemoteSigned -File \""+script+"\"";
   bool settings=Array.IndexOf(args,"--settings")>=0;
#if SETTINGS_ENTRY
   settings=true;
#endif
   if(settings)info.Arguments+=" -OpenSettings";
   info.UseShellExecute=false;info.CreateNoWindow=true;info.WindowStyle=ProcessWindowStyle.Hidden;info.WorkingDirectory=root;info.RedirectStandardError=true;
   info.EnvironmentVariables["PSModulePath"]=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell","v1.0","Modules")+Path.PathSeparator+Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"WindowsPowerShell","Modules");
   using(var helper=Process.Start(info)){
    var errors=new System.Text.StringBuilder();
    helper.ErrorDataReceived+=(sender,eventArgs)=>{if(eventArgs.Data!=null&&errors.Length<16000)errors.AppendLine(eventArgs.Data);};
    helper.BeginErrorReadLine();helper.WaitForExit();
    if(helper.ExitCode!=0&&errors.ToString().IndexOf("PSSecurityException",StringComparison.OrdinalIgnoreCase)>=0)
      MessageBox.Show("Windows 阻止了刚下载的脚本。请关闭本程序，在下载的 ZIP 文件上右键打开“属性”，勾选“解除锁定”后重新解压，再双击启动入口。","Codex Silver Startup",MessageBoxButtons.OK,MessageBoxIcon.Information);
    return helper.ExitCode;
   }
  } catch(Exception error){MessageBox.Show(error.Message,"Codex Silver Startup",MessageBoxButtons.OK,MessageBoxIcon.Warning);return 1;}
 }
}
