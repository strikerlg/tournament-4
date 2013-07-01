function create_player_sel_box(idx, el)
{
	var $text_entry = $(el);
	var $hidden_el = $('<input type="hidden">');
	var el_name = $text_entry.attr('name');

	$hidden_el.attr('name', el_name);
	$hidden_el.attr('value', $text_entry.attr('data-player_id'));

	$text_entry.removeAttr('name');

	$text_entry.after($hidden_el);
	setup_player_sel_box($text_entry, $hidden_el);
}

function setup_player_sel_box($text_entry, $hidden_el)
{
	$text_entry.autocomplete({
		source: players_src,
		focus: function(evt, ui) {
			$text_entry.val( ui.item.label );
			return false;
			},
		select: function(evt, ui) {
			$text_entry.val( ui.item.label );
			$hidden_el.val( ui.item.value );
			return false;
			}
		});
}

$(function() {
	$('input.player_sel').each(create_player_sel_box);
	});

var nextUniqueRowId = 1;
function on_add_participant_clicked(evt)
{
	evt.preventDefault();

	var name_prefix = 'participant__'+(nextUniqueRowId++);

	var $r = $('#new_participant_row').clone();
	$r.removeClass('template');
	$r.removeAttr('id');

	$('input', $r).each(function(idx,el) {
		var n = $(el).attr('name');
		if (n) {
			n = name_prefix+n;
			$(el).attr('name', n);
		}
		});

	setup_player_sel_box(
		$('input.player_sel', $r),
		$('.player_col input[type=hidden]', $r)
		);

	$('#participants_table').append($r);

	$('.delete_row_btn', $r).click(function(evt) {
		$r.remove();
		});

	return false;
}

function on_delete_participant_clicked(evt)
{
	var el = this;
	var row_el = null;
	var rowid = null;

	while (el && !rowid) {
		rowid = el.getAttribute('data-rowid');
		row_el = el;
		el = el.parentNode;
	}

	if (!rowid) { return; }

	var $x = $('<input type="hidden">');
	$x.attr('name', 'participant_'+rowid+'_delete');
	$x.attr('value', '1');
	$('#participants_table').after($x);

	$(row_el).remove();
}

$(function() {
	$('#add_participant_link').click(on_add_participant_clicked);
	$('.delete_row_btn').click(on_delete_participant_clicked);
});

$(function() {
	$('.driller_content').hide();
	$('.driller_heading').click(function() {
		$(this).next('.driller_content').slideToggle(500);
		});
});

$(function() {
	$('.popup_menu').each(function(idx,el) {
		$('ul', $(el)).menu();
		$('ul', $(el)).on('blur', function(evt) {
			$(el).hide();
			});
	});

	$('.popup_menu_btn').click(function(evt) {
		var elId = $(this).attr('data-for');
		var el = document.getElementById(elId);
		var $menu = $(el);
		$menu.css({
			left: 0,
			top: 0
			});
		$menu.position(
			{
			my: "right top",
			at: "right bottom",
			of: this,
			collision: "none"
			});
		$menu.show();
		$('ul', $menu).focus();
		});
	});

function on_new_player_select(evt, ui)
{
	var f = document.getElementById('new_person_form');
	f.name.value = ui.item.name;
	f.member_number.value = ui.item.member_number;
	f.entry_rank.value = ui.item.rating;
	f.home_location.value = ui.item.home_location;
}

$(function() {
	$('#new_person_form #name_entry').autocomplete({
		source: 'autocomplete-new-person.php?tournament='+webtd_tournament_id,
		minLength: 2,
		select: on_new_player_select
	});

	$('#new_person_form #member_number_entry').autocomplete({
		source: 'autocomplete-new-person.php?tournament='+webtd_tournament_id+'&field=member_number',
		select: on_new_player_select
	});
});

function make_game_results_file()
{
	var onError = function(jqxhr, status, errorThrown) {
		alert(status + ' ' + errorThrown);
	};
	var onSuccess = function(data) {

		var w = window.open(null, null, "width=360,height=480,scrollbars=yes");
		w.document.write("<pre>");
		w.document.write("TOURNEY "+data.tournament.name);
		if (data.tournament.location) {
			w.document.write(", "+data.tournament.location);
		}
		w.document.write("\n");
		if (data.tournament.start_time) {
			w.document.write("        start="+data.tournament.start_time+"\n");
		}
		if (data.tournament.end_time) {
			w.document.write("        finish="+data.tournament.end_time+"\n");
		}
		w.document.write("        rules=AGA\n");

		var players = data.players;
		var max_name_len = 0;
		for (var i in players) {
			var p = players[i];
			if (p.name.length > max_name_len) {
				max_name_len = p.name.length;
			}
		}

		w.document.write("PLAYERS\n");

		var players_by_pid = {};
		var tmp_number = 99999;
		for (var i in players) {
			var p = players[i];
			if (!p.member_number) {
				p.member_number = tmp_number--;
			}
			players_by_pid[p.pid] = p;
			w.document.write(strpad_l(p.member_number,5)+" ");
			w.document.write(strpad_r(p.name, max_name_len) + " ");
			w.document.write(p.entryRank + "\n");
		}

		w.document.write("GAMES\n");
		var plays = data.games;
		for (var i in plays) {
			var play = plays[i];
			var p1 = players_by_pid[play['player.W']];
			if (!p1) {
				w.document.write("WARNING: invalid W player\n");
				continue;
			}
			var p2 = players_by_pid[play['player.B']];
			if (!p2) {
				w.document.write("WARNING: invalid B player\n");
				continue;
			}

			var handicapStones = 0;
			var m = play.scenario.match(/(\d+) stone/);
			if (m) {
				handicapStones = +m[1];
			}
			var komi = 0;
			var m = play.scenario.match(/([\d.]+) komi/);
			if (m) {
				komi = +m[1];
			}
			w.document.write(p1.member_number +
				" " + p2.member_number +
				" " + (play.winner == 'W' ? 'w' : 'b') + " " +
				handicapStones + " " +
				komi + "\n");
		}
		w.document.write("</pre>");
	};

	$.ajax({
		url: 'scoreboard-data.js.php?tournament='+escape(webtd_tournament_id),
		dataType: 'json',
		success: onSuccess,
		error: onError
		});
}

function strpad_l(str, len)
{
	while (len - str.length >= 10)
		str = "          " + str;
	if (str.length < len)
		str = "          ".substr(0,len - str.length) + str;
	return str;
}

function strpad_r(str, len)
{
	while (len - str.length >= 10)
		str += "          ";
	if (str.length < len)
		str += "          ".substr(0,len - str.length);
	return str;
}

$(function() {
	$('#make_game_results_link').click(make_game_results_file);
});

function load_pairings_into(pairings_data, container_el)
{
	var players_raw = pairings_data.players;
	var assignments = pairings_data.contests;

	var players = {};
	for (var i = 0; i < players_raw.length; i++) {
		players[players_raw[i].pid] = players_raw[i];
	}

	var all_rounds = {};
	var all_tables = {};
	for (var i = 0; i < assignments.length; i++) {
		var a = assignments[i];
		all_rounds[a.round] = {};
		all_tables[a.table] = {};
	}

	var rounds_sorted = Object.keys(all_rounds).sort();
	var tables_sorted = Object.keys(all_tables).sort();

	function setup_contest_box_handlers(contest_box_el)
	{
		function onDragEnter(evt) {
			this.classList.add('over');
		}
		function onDragOver(evt) {
			evt.preventDefault();
			evt.dataTransfer.dropEffect = 'move';
		}
		function onDragLeave(evt) {
			this.classList.remove('over');
		}
		function onDrop(evt) {
			evt.stopPropagation();

			var data = evt.dataTransfer.getData('application/webtd+person');
			var dataType = null;
			if (data) {
				dataType = 'person';
			}
			else {
				data = evt.dataTransfer.getData('application/webtd+seat');
				dataType = 'seat';
			}
			alert('got '+dataType+' '+data);
		}
		contest_box_el.addEventListener('dragenter', onDragEnter);
		contest_box_el.addEventListener('dragover', onDragOver);
		contest_box_el.addEventListener('dragleave', onDragLeave);
		contest_box_el.addEventListener('drop', onDrop);
	}

	function setup_seat_box_handlers($p)
	{
		function handleDragStart(evt) {
			this.style.opacity = '0.4';
			evt.dataTransfer.effectAllowed = 'move';

			if (this.getAttribute('data-webtd-person')) {
				evt.dataTransfer.setData('application/webtd+person', this.getAttribute('data-webtd-person'));
			}
			else {
				evt.dataTransfer.setData('application/webtd+seat', this.getAttribute('data-webtd-seat'));
			}
		}
		$p.get(0).addEventListener('dragstart', handleDragStart, false);
	}

	for (var i = 0; i < tables_sorted.length; i++) {
		var table_id = tables_sorted[i];
		var $tr = $('<tr></tr>');
		$tr.attr('data-webtd-table', table_id);

		for (var j = 0; j < rounds_sorted.length; j++) {
			var round_name = rounds_sorted[j];
			var $td = $('<td></td>');
			$td.attr('data-webtd-round', round_name);
			$tr.append($td);
		}

		$('.pairings_grid', container_el).append($tr);
	}

	function get_cell(round, table)
	{
		return $('.pairings_grid tr[data-webtd-table='+table+'] td[data-webtd-round='+round+']', container_el);
	}

	for (var i in assignments) {
		var a = assignments[i];
		var $a = $('.match_container.template',container_el).clone();
		setup_contest_box_handlers($a.get(0));
		$a.removeClass('template');
		$('.round',$a).text(a.round);
		$('.table',$a).text(a.table);
		for (var j in a.players) {
			var pid = a.players[j].pid;
			var p = players[pid];
			var $p = $('<li class="seat_box" draggable="draggable"><img src="images/person_icon.png" width="18" height="18"><span class="person_name"></span></li>');
			$p.attr('data-webtd-person', pid);
			$p.attr('data-webtd-seat', a.players[j].seat);
			$('.person_name',$p).text(p != null ? p.name : ("?"+pid));
			$('.players_list',$a).append($p);

			setup_seat_box_handlers($p);
		}

		var $td = get_cell(a.round, a.table);
		$td.append($a);
	}
}

$(function() {
	function onError(jqxhr, textStatus, errorThrown) { }
	function onSuccess(data) {
		$('.pairings_container').each(function(idx,el) {
			load_pairings_into(data, el);
		});
	}

	if ($(".pairings_container").length) {
		$.ajax({
		url: 'assignments-data.js.php?tournament='+escape(webtd_tournament_id),
		dataType: 'json',
		error: onError,
		success: onSuccess
		});
	}
});
