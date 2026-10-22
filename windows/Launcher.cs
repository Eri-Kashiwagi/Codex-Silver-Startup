using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
static class Launcher {
 [STAThread] static int Main(string[] args) {
  try {
   string root=AppDomain.CurrentDomain.BaseDirectory;
   string script=Path.Combine(root,"windows","launch.ps1");
   if(!File.Exists(script))throw new FileNotFoundException("Startup files are missing. Extract and keep the entire package folder.",script);
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
      MessageBox.Show("Windows blocked a downloaded script. Close this launcher, open the ZIP file's Properties, select Unblock if available, then extract the ZIP again and run Start Codex.exe.","Codex Silver Startup",MessageBoxButtons.OK,MessageBoxIcon.Information);
    return helper.ExitCode;
   }
  } catch(Exception error){MessageBox.Show(error.Message,"Codex Silver Startup",MessageBoxButtons.OK,MessageBoxIcon.Warning);return 1;}
 }
}
