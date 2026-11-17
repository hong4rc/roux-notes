import { Component, type ReactNode } from "react";
import { tr } from "../lib/i18n";

/** Keeps one broken page from blanking the whole site. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="callout warn" role="alert">
        <div className="ttl">{tr("Trang này gặp lỗi", "This page ran into an error")}</div>
        <p style={{ margin: 0 }}>
          {tr(
            <>Bạn thử tải lại trang, hoặc <a href="#/">về trang chủ</a>. Nếu lỗi lặp lại, thử xoá dữ liệu trang trong trình duyệt.</>,
            <>Try reloading the page or <a href="#/">go to the home page</a>. If it keeps happening, clear this site's data in your browser.</>,
          )}
        </p>
      </div>
    );
  }
}
