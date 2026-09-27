CREATE TABLE IF NOT EXISTS oaspe_schema_migrations (
  migration_id VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint

CREATE TABLE IF NOT EXISTS oaspe_import_runs (
  id CHAR(36) PRIMARY KEY,
  source_filename VARCHAR(255) NOT NULL,
  source_sha256 CHAR(64) NOT NULL,
  status ENUM('running', 'completed', 'failed') NOT NULL DEFAULT 'running',
  expected_records INT UNSIGNED NOT NULL,
  staged_records INT UNSIGNED NOT NULL DEFAULT 0,
  quarantined_records INT UNSIGNED NOT NULL DEFAULT 0,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  error_message VARCHAR(500) NULL,
  INDEX idx_oaspe_import_source (source_sha256),
  INDEX idx_oaspe_import_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint

CREATE TABLE IF NOT EXISTS oaspe_wxr_records (
  wordpress_id BIGINT UNSIGNED PRIMARY KEY,
  post_type VARCHAR(80) NOT NULL,
  legacy_status VARCHAR(40) NOT NULL,
  migration_state ENUM('staged', 'quarantined', 'approved') NOT NULL,
  title TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL DEFAULT '',
  published_at DATETIME NULL,
  creator VARCHAR(190) NOT NULL DEFAULT '',
  parent_wordpress_id BIGINT UNSIGNED NULL,
  attachment_url TEXT NULL,
  sanitized_html LONGTEXT NOT NULL,
  content_sha256 CHAR(64) NOT NULL,
  media_urls_json JSON NOT NULL,
  taxonomy_json JSON NOT NULL,
  quarantine_reasons_json JSON NOT NULL,
  first_import_run_id CHAR(36) NOT NULL,
  last_import_run_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_oaspe_wxr_type_state (post_type, migration_state),
  INDEX idx_oaspe_wxr_slug (slug),
  INDEX idx_oaspe_wxr_parent (parent_wordpress_id),
  CONSTRAINT fk_oaspe_wxr_first_run FOREIGN KEY (first_import_run_id) REFERENCES oaspe_import_runs(id),
  CONSTRAINT fk_oaspe_wxr_last_run FOREIGN KEY (last_import_run_id) REFERENCES oaspe_import_runs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
