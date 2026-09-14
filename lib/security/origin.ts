const SAFE_CAPACITOR_ORIGINS=['capacitor://localhost','ionic://localhost','http://localhost'];
export function isAllowedOrigin(req:Request){
  const origin=req.headers.get('origin');
  if(!origin)return true;
  if(SAFE_CAPACITOR_ORIGINS.includes(origin))return true;
  const app=process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/,'');
  return !!app&&origin===app;
}
