function get_url_param(p)
{
	var args = document.location.search.substring(1).split("&");
	for (var i in args)
	{
		var x = args[i].split("=", 2);
		if (unescape(x[0]) == p)
		{
			return unescape(x[1]);
		}
	}
	return null;
}

function generate_short_name(p)
{
	var n = p.name;
	if (n.match(/,/)) {
		var i = n.indexOf(',');
		n = n.substring(i+1) + ' ' + n.substring(0,i);
	}

	var parts = n.split(/[ -]/);

	var x = "";
	for (var i in parts) {
		x += parts[i].substr(0,1);
	}
	return x;
}
function do_short_names(players_arr)
{
	for (var i in players_arr)
	{
		var p = players_arr[i];
		if (!p.initials) {
			if (p.ordinal) {
				p.initials = ""+p.ordinal;
			}
			else {
				p.initials = generate_short_name(p);
			}
		}
	}
}
function to_rank(rankStr)
{
	return parseInt(rankStr.substr(0,rankStr.length-1)) *
			(rankStr.substr(rankStr.length-1) == 'k' ? -1 : 1);
}
function cmp_rank(a, b)
{
	var a_r = to_rank(a.entryRank || "30k");
	var b_r = to_rank(b.entryRank || "30k");
	return -(a_r - b_r);
}

function fetch_all_players()
{
	var onError = function(jqxhr, status, errorThrown) {
		alert(status + ' ' + errorThrown);
	};

	$.ajax({
		url: 'scoreboard-data.js.php?tournament='+escape(get_url_param('tournament')),
		dataType: 'json',
		success: on_players_fetched,
		error: onError
		});
}

var players = [];
var games = [];
var S = {
	start: get_url_param('start'),
	ROWS: 8,
	COLS: 12,
	DELAY: 30, //seconds
	ROUND_ROBIN: true
	};

function in_game(play, pid)
{
	var seats_array = play.seats.split(/,/);
	for (var i = 0; i < seats_array.length; i++) {
		var s = seats_array[i];
		if (play['player.'+s] == pid) {
			return true;
		}
	}
	return false;
}

function on_players_fetched(data)
{
	players = data.players;
	games = data.games;

	players = players.sort(cmp_rank);
	do_short_names(players);

	var player_by_pid = {};
	for (var i = 0; i < players.length; i++) {
		player_by_pid[players[i].pid] = players[i];
	}

	if (S.ROUND_ROBIN) {
		$('.round_robin_buffer_col').show();
		for (var i in players)
		{
			var pc = players[i];
			var $cell = $('<th width="35"></th>');
			$cell.text(pc.initials);
			$cell.attr('class', 'opponent'+pc.pid+'_col');
			$('#th_row').append($cell);
		}
	}

if (S.start == null) { S.start = 0; }
S.min_opp_by_pid = new Array();
S.max_opp_by_pid = new Array();
for (var i = 0; i < players.length; i++)
{
	var pr = players[i];
	var $row = $('#scoreboard_row').clone();
	$row.removeClass('template');
	$row.attr('class', (i % 2 == 0) ? 'oddrow' : 'evenrow');
	$row.attr('id', "scoreboard_row"+i);
	$('.fullname_cell', $row).text(pr.name + (pr.entryRank != null ? (' ' + pr.entryRank) : "") +
		(pr.ordinal != null ? (' (' + pr.ordinal + ')') : ''));
	var count_wins = 0;
	var count_plays = 0;
	for (var j in players)
	{
		var pc = players[j];
		var $cell = $('<td></td>');
		$cell.attr('class', 'opponent'+pc.pid+'_col');
		for (var k in games)
		{
			var play = games[k];
			var result = null;
			if (pr.pid != pc.pid &&
				in_game(play, pr.pid) && in_game(play, pc.pid))
			{
				result = play.in_progress ? 'P' :
					(play.winner && play['player.'+play.winner] == pr.pid) ? 'W' :
					'L';
			}
			else
			{
				continue;
			}

			if (result != 'P') {
				count_plays++;
			}
			if (result == 'W') {
				count_wins++;
			}
			if (S.min_opp_by_pid[pr.pid] == null) {
				S.min_opp_by_pid[pr.pid] = j;
			}
			S.max_opp_by_pid[pr.pid] = j;

			var $img = $('<div><img width="28" height="28"></div>');
			$('img',$img).attr('alt', result);
			$('img',$img).attr('title', 'details');
			$('img',$img).attr('src',
				result == "P" ? 'images/game_in_progress_icon.png' :
				result == "W" ? 'images/win_icon.png' : 'images/lose_icon.png');
			$cell.append($img);
		}

		if (S.ROUND_ROBIN) {
			$row.append($cell);
		}
	}
	$('.wins_cell', $row).text(count_wins);
	$('.plays_cell', $row).text(count_plays);
	$('.score_col', $row).text(count_wins+'-'+(count_plays-count_wins));

	// last result
	if (pr.lastResult) {
		var opps_arr = pr.lastOpponents.split(/,/);
		var opps_str = '';
		for (var k1 = 0; k1 < opps_arr.length; k1++) {
			if (k1 > 0) { opps_str += ','; }
			var k2 = opps_arr[k1];
			opps_str += player_by_pid[k2].initials;
		}
		$('.last_result_col .opponent', $row).text(opps_str);
		$('.last_result_col .result_icon', $row).
			attr('src', pr.lastResult=='WIN' ? 'images/win_icon.png' :
				pr.lastResult=='TIE' ? 'images/tie_icon.png' : 'images/lose_icon.png').
			attr('alt', pr.lastResult);
	}
	else {
		$('.last_result_col', $row).empty();
	}

	$('#scoreboard_table').append($row);
	if (i < S.start || i >= S.start + S.ROWS)
	{
		$row.hide();
	}
} //end foreach player row

	prune_columns(S.start, S.start+S.ROWS);
	setTimeout(nextPage,S.DELAY * 1000);
}

function prune_columns(row0, row1)
{
	var min_opp = row0;
	var max_opp = row1 - 1;
	for (var a = row0; a < row1 && a < players.length; a++)
	{
		if (S.min_opp_by_pid[players[a].pid] != null
			&& S.min_opp_by_pid[players[a].pid] < min_opp)
		{
			min_opp = S.min_opp_by_pid[players[a].pid];
		}
		if (S.max_opp_by_pid[players[a].pid] != null
			&& S.max_opp_by_pid[players[a].pid] > max_opp)
		{
			max_opp = S.max_opp_by_pid[players[a].pid];
		}
	}

	var d = S.COLS - (max_opp - min_opp + 1);
	if (d > 0)
	{
		min_opp -= d;
	}
	if (min_opp < 0)
	{
		var x = -min_opp;
		max_opp += x;
		min_opp += x;
	}

	for (var a = 0; a < players.length; a++)
	{
		var $s = $('.opponent'+players[a].pid+'_col');
		if (a < min_opp || a > max_opp)
		{
			$s.hide();
		}
		else
		{
			$s.show();
		}
	}
}

function nextPage()
{
	if (S.start+S.ROWS < players.length)
	{
		var i = S.start;
		var j = S.start + S.ROWS;

		var $old = $('#scoreboard_row'+i);
		for (var a = i + 1; a < j; a++)
		{
			$old = $old.add('#scoreboard_row'+a);
		}

		var $new = $('#scoreboard_row'+j);
		for (var a = j + 1; a < j + S.ROWS && a < players.length; a++)
		{
			$new = $new.add('#scoreboard_row'+a);
		}

		$old.hide();
		$new.show();
		S.start += S.ROWS;
		prune_columns(S.start, S.start + S.ROWS);

		setTimeout(nextPage, S.DELAY * 1000);
	}
	else
	{
		window.location.reload();
	}
}

fetch_all_players();


