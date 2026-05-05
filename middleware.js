import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.pathname;

  if (url.startsWith("/api/save")) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  const usersRaw = process.env.LOGIN_USERS || "";

  const users = usersRaw.split(",").map(u => {
    const [user, pass] = u.split(":");
    return { user, pass };
  });

  if (auth) {
    const base64 = auth.split(" ")[1];
    const [user, pass] = atob(base64).split(":");

    const valid = users.find(u => u.user === user && u.pass === pass);

    if (valid) {
      return NextResponse.next();
    }
  }

  return new Response("Giris gerekli", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Scanner Panel"'
    }
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
