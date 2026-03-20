"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type PortalType = "user" | "writer" | "sponsor" | "unknown";

interface PortalContextType {
    portalType: PortalType;
    port: string;
}

const PortalContext = createContext<PortalContextType>({
    portalType: "unknown",
    port: "",
});

export const usePortal = () => useContext(PortalContext);

export function PortalProvider({ children }: { children: React.ReactNode }) {
    const [portalType, setPortalType] = useState<PortalType>("unknown");
    const [port, setPort] = useState("");
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const currentPort = window.location.port;
            setPort(currentPort);

            let type: PortalType = "user";
            if (currentPort === "3001") type = "writer";
            else if (currentPort === "3002") type = "sponsor";

            setPortalType(type);

            // --- 리다이렉션 로직: 특정 포트에서 허용되지 않는 경로 접근 시 처리 ---

            // 1. 작가 전용 포트 (3001)
            if (type === "writer") {
                if (pathname === "/login") {
                    // 로그인 페이지는 허용
                } else if (pathname === "/" || pathname === "/register") {
                    router.replace("/login");
                } else if (!pathname.startsWith("/writer") && !pathname.startsWith("/api")) {
                    // 작가 포트에서는 작가 관련 경로만 허용 (그 외는 로그인으로)
                    router.replace("/login");
                }
            }

            // 2. 스폰서 전용 포트 (3002)
            else if (type === "sponsor") {
                if (pathname === "/login") {
                    // 로그인 페이지는 허용
                } else if (pathname === "/" || pathname === "/register") {
                    router.replace("/login");
                } else if (!pathname.startsWith("/sponsor") && !pathname.startsWith("/api")) {
                    // 스폰서 포트에서는 스폰서 관련 경로만 허용 (그 외는 로그인으로)
                    router.replace("/login");
                }
            }

            // 3. 일반 사용자 포트 (3000)
            else if (type === "user") {
                if (pathname.startsWith("/writer")) {
                    console.warn("Please use port 3001 for Writer Portal");
                } else if (pathname.startsWith("/sponsor")) {
                    console.warn("Please use port 3002 for Sponsor Portal");
                }
            }
        }
    }, [pathname, router]);

    return (
        <PortalContext.Provider value={{ portalType, port }}>
            {children}
        </PortalContext.Provider>
    );
}
