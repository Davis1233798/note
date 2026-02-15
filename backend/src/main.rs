use axum::{
    http::Method,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use tracing::info;

#[tokio::main]
async fn main() {
    // 初始化日誌
    tracing_subscriber::fmt::init();

    // CORS 設定
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::PATCH])
        .allow_headers(Any);

    // API 路由
    let api_routes = Router::new()
        .route("/health", get(health_check));

    // 靜態檔案服務（前端 build 結果）
    let static_service = ServeDir::new("static")
        .fallback(tower_http::services::ServeFile::new("static/index.html"));

    // 主路由
    let app = Router::new()
        .nest("/api", api_routes)
        .fallback_service(static_service)
        .layer(cors);

    // 啟動伺服器
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .expect("PORT must be a number");

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("🚀 Server starting on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Health check endpoint
async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "service": "note-backend",
        "version": "0.1.0"
    }))
}
