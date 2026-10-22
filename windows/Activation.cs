using System;
using System.Text;
using System.Runtime.InteropServices;
[ComImport,Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C")]
public class PackageActivationManager {}
[ComImport,Guid("2E941141-7F97-4756-BA1D-9DECDE894A3D"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IPackageActivationManager {
 [PreserveSig] int ActivateApplication([MarshalAs(UnmanagedType.LPWStr)] string id,[MarshalAs(UnmanagedType.LPWStr)] string arguments,uint options,out uint pid);
}
public static class PackageStartup {
 [DllImport("kernel32.dll",SetLastError=true)] static extern IntPtr OpenProcess(uint access,bool inherit,uint pid);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)] static extern int GetPackageFullName(IntPtr process,ref uint length,StringBuilder name);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr process);
 public static uint Launch(string id,string arguments){
  var manager=(IPackageActivationManager)new PackageActivationManager();
  try{uint pid;Marshal.ThrowExceptionForHR(manager.ActivateApplication(id,arguments,2,out pid));return pid;}
  finally{Marshal.ReleaseComObject(manager);}
 }
 public static string PackageName(uint pid){
  var handle=OpenProcess(0x1000,false,pid);
  if(handle==IntPtr.Zero)throw new Exception("Cannot inspect listener process");
  try{
   uint size=0;int code=GetPackageFullName(handle,ref size,null);
   if(code==15700)return "";
   if(code!=122)throw new Exception("Cannot inspect package identity: "+code);
   var value=new StringBuilder((int)size);
   code=GetPackageFullName(handle,ref size,value);
   if(code!=0)throw new Exception("Cannot read package identity: "+code);
   return value.ToString();
  }finally{CloseHandle(handle);}
 }
}
