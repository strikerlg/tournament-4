prefix = /srv/www/htdocs/webtd

data_files = \
	webtd.css \
	webtd.js \
	scoreboard.html \
	scoreboard.css \
	scoreboard.js \
	images/edit.gif \
	images/plus.png \
	images/minus.png \
	images/green_check.png \
	images/red_cross.png \
	images/tentative_icon.png \
	images/bad_result.png \
	images/good_result.png \
	images/neutral_result.png \
	images/very_bad_result.png \
	images/very_good_result.png \
	images/win_icon.png \
	images/tie_icon.png \
	images/lose_icon.png \
	images/game_in_progress_icon.png \
	images/person_icon.png \
	images/team_icon.png \
	images/contest_assigned_icon.png \
	images/contest_completed_icon.png \
	images/contest_proposed_icon.png \
	images/contest_started_icon.png \
	images/seat_gb_icon.png \
	images/seat_yb_icon.png \
	images/create_doc.png \
	images/create_doc_bad.png \
	images/create_doc_good.png

php_scripts = \
	assignments-data.js.php \
	autocomplete-new-person.php \
	card_stats.php \
	check_player_next_assignments.php \
	config-sample.php \
	contest.php \
	contest_participant.php \
	game_definition.php \
	game_definition.inc.php \
	import_person.php \
	index.php \
	list_roster.inc.php \
	login.php \
	pairings.php \
	person.php \
	player_scorecard.php \
	rating_chart.inc.php \
	run_ratings.php \
	scheduler.php \
	scoreboard-data.js.php \
	team.php \
	tournament.php \
	tournament_dashboard.php \
	venue.php \
	venues.php \
	includes/auth.php \
	includes/db.php \
	includes/form.php \
	includes/format.php \
	includes/pairing_functions.php \
	includes/ratings_functions.php \
	includes/scores.php \
	includes/skin.php

all:

install:
	mkdir -p "$(prefix)/images"
	mkdir -p "$(prefix)/includes"
	for f in $(php_scripts) $(data_files); do \
		cp "$$f" "$(prefix)/$$f"; \
	done
