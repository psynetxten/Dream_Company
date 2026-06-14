import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AppBar from "../AppBar";

describe("AppBar", () => {
  it("showBack 없을 때 로고 '꿈신문사' 표시", () => {
    render(<AppBar />);
    expect(screen.getByText("꿈신문사")).toBeInTheDocument();
  });

  it("showBack + title 일 때 타이틀 텍스트 표시", () => {
    render(<AppBar title="테스트 페이지" showBack />);
    expect(screen.getByText("테스트 페이지")).toBeInTheDocument();
  });

  it("showBack=true 일 때 뒤로가기 버튼(button) 표시", () => {
    render(<AppBar title="타이틀" showBack backHref="/" />);
    const backBtn = screen.getByRole("button", { name: /뒤로가기/i });
    expect(backBtn).toBeInTheDocument();
  });

  it("showBack=false 일 때 뒤로가기 버튼 없음", () => {
    render(<AppBar title="타이틀" />);
    expect(screen.queryByRole("button", { name: /뒤로가기/i })).toBeNull();
  });

  it("showBack 없을 때 로고가 / 링크", () => {
    render(<AppBar />);
    const logo = screen.getByRole("link", { name: /꿈신문사/i });
    expect(logo).toHaveAttribute("href", "/");
  });

  it("right 슬롯 렌더링", () => {
    render(<AppBar right={<button>알림</button>} />);
    expect(screen.getByRole("button", { name: /알림/i })).toBeInTheDocument();
  });
});
