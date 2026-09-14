import 'next-auth';
import 'next-auth/jwt';
declare module 'next-auth' { interface Session { user:{id:string;shopId?:string}&DefaultSession['user'] } interface User {shopId?:string} }
declare module 'next-auth/jwt' { interface JWT {id?:string;shopId?:string} }
