CREATE TABLE IF NOT EXISTS oaspe_page_sections (
  page_key VARCHAR(80) NOT NULL,
  section_key VARCHAR(80) NOT NULL,
  title VARCHAR(500) NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  image_path VARCHAR(500) NOT NULL DEFAULT '',
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (page_key, section_key),
  INDEX idx_oaspe_page_sections_position (page_key, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint

CREATE TABLE IF NOT EXISTS oaspe_portfolio_projects (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(190) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  year_label VARCHAR(20) NOT NULL DEFAULT '',
  summary TEXT NOT NULL,
  details_json JSON NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_oaspe_portfolio_position (position, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint

CREATE TABLE IF NOT EXISTS oaspe_portfolio_deletions (
  slug VARCHAR(190) PRIMARY KEY,
  deleted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint

CREATE TABLE IF NOT EXISTS oaspe_contact_messages (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(320) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  delivery_status ENUM('received', 'sent', 'failed') NOT NULL DEFAULT 'received',
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_oaspe_contact_created (created_at),
  INDEX idx_oaspe_contact_status (delivery_status, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- statement-breakpoint

INSERT IGNORE INTO oaspe_page_sections (page_key, section_key, title, body, image_path, position) VALUES
('home', 'hero', 'Ανάπτυξη ακαδημιών. Με το παιδί στο κέντρο.', 'Στηρίζουμε την οργάνωση, την εξέλιξη και την προβολή σχολών και ακαδημιών ποδοσφαίρου σε όλη την Ελλάδα και τον ελληνισμό της διασποράς.', '/images/wordpress/2024/12/oaspe_header_main_page_14.png', 1),
('home', 'about', 'Πρωτοπορούμε στα αθλητικά δρώμενα της χώρας.', 'Ο ΟΑΣΠΕ δημιουργήθηκε με έμπνευση της Δώρας Ιωακειμίδου και συνεργάζεται με επαγγελματίες της αθλητικής διοίκησης, προπονητές και επιστήμονες.', '/images/wordpress/2024/10/football-about.jpg', 2),
('home', 'services', 'Χτίζουμε το αύριο των ακαδημιών.', 'Οργάνωση ακαδημιών, εκπαίδευση, δράσεις, συνεργασίες, ενημέρωση και προβολή.', '/images/wordpress/2016/03/Acadimies_big-1.jpg', 3),
('home', 'projects', 'Πρωτοβουλίες με διάρκεια και ουσιαστικό αποτύπωμα.', 'Επιλεγμένα έργα και δράσεις του ΟΑΣΠΕ.', '/images/wordpress/2018/11/DSC_2751.jpg', 4),
('sxetika', 'hero', 'Σχετικά με εμάς', 'Ένας οργανισμός με το παιδί, την οικογένεια και την αξία της συμμετοχής στο κέντρο.', '/images/wordpress/2024/10/oaspe_QUOTE_BANNER_2-scaled.jpg', 1),
('skopos', 'hero', 'Ο σκοπός του ΟΑΣΠΕ', 'Εργαζόμαστε για έναν αθλητισμό που εκπαιδεύει, ενώνει και προστατεύει κάθε παιδί.', '/images/wordpress/2016/02/skopos_17.jpg', 1),
('dwrees', 'hero', 'Δωρεές', 'Κάθε προσφορά βοηθά να δημιουργήσουμε περισσότερες δράσεις με ουσιαστικό κοινωνικό αποτύπωμα.', '/images/wordpress/2024/10/dwrees_oaspe_header-scaled.jpg', 1),
('epikoinonia', 'hero', 'Επικοινωνία', 'Μιλήστε μαζί μας για συνεργασίες, δράσεις και πρωτοβουλίες.', '/images/wordpress/2016/02/goneis_paidia_17.jpg', 1);
