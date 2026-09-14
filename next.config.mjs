/** @type {import('next').NextConfig} */
const securityHeaders=[
 {key:'X-Content-Type-Options',value:'nosniff'},
 {key:'X-Frame-Options',value:'DENY'},
 {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 {key:'Permissions-Policy',value:'camera=(self), microphone=(self), geolocation=()'},
 {key:'X-DNS-Prefetch-Control',value:'on'},
 {key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains; preload'},
];
const nextConfig={poweredByHeader:false,experimental:{serverActions:{bodySizeLimit:'1mb'}},async headers(){return [{source:'/:path*',headers:securityHeaders}]}};
export default nextConfig;
