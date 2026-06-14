import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MobileBottomNav from "../MobileBottomNav";

// PortalProvider mock
const mockUsePortal = vi.fn();
vi.mock("@/components/PortalProvider", () => ({
  usePortal: () => mockUsePortal(),
}));

vi.mock("@/lib/auth", () => ({
  signOut: vi.fn(),
}));

describe("MobileBottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로딩 중에는 렌더링하지 않음", () => {
    mockUsePortal.mockReturnValue({ portalType: "unknown", isLoading: true });
    const { container } = render(<MobileBottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it("게스트에게 홈/로그인 탭 + FAB 표시", () => {
    mockUsePortal.mockReturnValue({ portalType: "guest", isLoading: false });
    render(<MobileBottomNav />);
    // 3개 링크: 홈, 로그인, center FAB(/register)
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    const hrefs = links.map(l => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/login");
    expect(hrefs).toContain("/register");
  });

  it("일반 유저에게 홈/의뢰/마이페이지 3탭 표시", () => {
    mockUsePortal.mockReturnValue({ portalType: "user", isLoading: false });
    render(<MobileBottomNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    const hrefs = links.map(l => l.getAttribute("href"));
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/order/new");
    expect(hrefs).toContain("/profile");
  });

  it("작가에게 집무실/템플릿/홈 탭 표시", () => {
    mockUsePortal.mockReturnValue({ portalType: "writer", isLoading: false });
    render(<MobileBottomNav />);
    expect(screen.getByRole("link", { name: /집무실/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /템플릿/i })).toBeInTheDocument();
  });

  it("스폰서에게 대시보드/슬롯/홈 탭 표시", () => {
    mockUsePortal.mockReturnValue({ portalType: "sponsor", isLoading: false });
    render(<MobileBottomNav />);
    expect(screen.getByRole("link", { name: /대시보드/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /슬롯/i })).toBeInTheDocument();
  });

  it("유저 탭에서 홈 링크는 / 경로", () => {
    mockUsePortal.mockReturnValue({ portalType: "user", isLoading: false });
    render(<MobileBottomNav />);
    const homeLink = screen.getByRole("link", { name: /홈/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("유저 탭에서 의뢰 FAB 링크는 /order/new 경로", () => {
    mockUsePortal.mockReturnValue({ portalType: "user", isLoading: false });
    render(<MobileBottomNav />);
    const links = screen.getAllByRole("link");
    const orderLink = links.find(l => l.getAttribute("href") === "/order/new");
    expect(orderLink).toBeDefined();
  });
});
