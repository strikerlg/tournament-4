CREATE TABLE master (
	version INTEGER NOT NULL
	);

INSERT INTO master (version) VALUES (3);

CREATE TABLE account (
	username VARCHAR(20) NOT NULL PRIMARY KEY,
	enabled CHAR(1) NOT NULL DEFAULT 'Y',
	is_sysadmin CHAR(1) NOT NULL DEFAULT 'N',
	created DATETIME NOT NULL,
	last_login DATETIME
	);

CREATE TABLE tournament (
	id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(200) NOT NULL,
	location VARCHAR(200),
	start_time DATETIME,
	multi_game CHAR(1) NOT NULL DEFAULT 'N',
	multi_session CHAR(1) NOT NULL DEFAULT 'N',
	multi_round CHAR(1) NOT NULL DEFAULT 'Y',
	current_session INTEGER,
	multi_table CHAR(1) NOT NULL DEFAULT 'Y',
	vocab_table VARCHAR(20) NOT NULL DEFAULT 'table'
	);

CREATE TABLE tournament_role (
	account VARCHAR(20) NOT NULL,
	tournament INTEGER NOT NULL,
	is_director CHAR(1) NOT NULL DEFAULT 'N',
	PRIMARY KEY (account, tournament),
	FOREIGN KEY (tournament) REFERENCES tournament (id),
	FOREIGN KEY (account) REFERENCES account (username)
	);

-- status: one of 'prereg', 'ready', 'absent', 'hidden'
CREATE TABLE person (
	id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	tournament INTEGER NOT NULL,
	name VARCHAR(200),
	member_number VARCHAR(200),
	home_location VARCHAR(200),
	mail VARCHAR(200),
	status VARCHAR(20),
	entry_rank VARCHAR(20),
	rating FLOAT,
	FOREIGN KEY (tournament) REFERENCES tournament (id)
	);

CREATE TABLE game_definition (
	id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	tournament INTEGER NOT NULL,
	name VARCHAR(200) NOT NULL,
	seat_names VARCHAR(200) NOT NULL,
	FOREIGN KEY (tournament) REFERENCES tournament (id)
	);

-- status: one of 'completed', 'proposed', etc.
CREATE TABLE contest (
	id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	tournament INTEGER NOT NULL,
	session_num INTEGER,
	round VARCHAR(200),
	board VARCHAR(200),
	game INTEGER,
	scenario VARCHAR(4000),
	status VARCHAR(200),
	started VARCHAR(20),
	finished VARCHAR(20),
	notes TEXT,
	FOREIGN KEY (tournament) REFERENCES tournament (id),
	FOREIGN KEY (game) REFERENCES game_definition (id)
	);

-- status: one of
--      P = proposed
--      C = confirmed
--      M = mulligan
--     or NULL = unspecified
-- w_points: what the result is worth to this player in
--     the overall tournament
--
CREATE TABLE contest_participant (
	id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	contest INTEGER NOT NULL,
	player INTEGER,
	seat VARCHAR(200),
	status CHAR(1),
	handicap VARCHAR(200),
	turn_order INTEGER,
	score VARCHAR(200),
	placement INTEGER,
	w_points FLOAT,
	performance FLOAT,
	expected_performance FLOAT,
	FOREIGN KEY (contest) REFERENCES contest (id),
	FOREIGN KEY (player) REFERENCES person (id)
	);

CREATE TABLE column_type (
	name VARCHAR(200) NOT NULL PRIMARY KEY,
	type_data VARCHAR(4000)
	);

INSERT INTO column_type (name, type_data) VALUES (
	'PLAY.STATUS', 'enum:proposed,assigned,started,suspended,aborted,completed'
	);
INSERT INTO column_type (name, type_data) VALUES (
	'PERSON.STATUS', 'enum:prereg,ready,absent'
	);

CREATE TABLE player_rating (
	id INTEGER NOT NULL,
	session_num INTEGER NOT NULL,
	prior_rating FLOAT NOT NULL,
	post_rating FLOAT NOT NULL,
	PRIMARY KEY (id, session_num),
	FOREIGN KEY (id) REFERENCES person (id)
	);

CREATE TABLE rating_batch (
	id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	tournament INTEGER NOT NULL,
	target_session INTEGER,
	created DATETIME NOT NULL,
	FOREIGN KEY (tournament) REFERENCES tournament (id)
	);

CREATE TABLE rating_identity (
	id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT,
	batch INTEGER NOT NULL,
	player INTEGER NOT NULL,
	rating_cycle INTEGER NOT NULL,
	rating FLOAT NOT NULL,
	FOREIGN KEY (batch) REFERENCES rating_batch (id),
	FOREIGN KEY (player) REFERENCES person (id)
	);

CREATE TABLE rating_data (
	batch INTEGER NOT NULL,
	player_a INTEGER NOT NULL,
	player_b INTEGER NOT NULL,
	actual_performance FLOAT NOT NULL,
	expected_performance FLOAT NOT NULL,
	weight FLOAT NOT NULL,
	FOREIGN KEY (batch) REFERENCES rating_batch (id),
	FOREIGN KEY (player_a) REFERENCES rating_identity (id),
	FOREIGN KEY (player_b) REFERENCES rating_identity (id)
	);
