/*
 * TODO
 * 
 * Refactoring
 * - players Array to Object
 * - Objectify setdeck(), setplayers(), deselectColor and the playerSelect HTML
 * - Make variable for available turns ("currentTurn <= turns.length") (.skipplayer, updateMoves)
 *
 * Bugs
 *
 * Last action of round is not undoable from re-clicking, only from undo button
 *
 * Functionality
 * - Cards which award resources on rounds
 *
 * Tools Screen
 * - Move skip button onto tools screen
 * - add special family growth to tools screen
 * - add calculator to tools screen
 *
 * - Edeck Tools: Master Forester: 2 Wood (not an action)
 * - Edeck Tools: Head of the Family (Family Growth)
 */


var myScroll;
function loaded() {
	myScroll = new iScroll('wrapper', { checkDOMChanges: true });
}

var isiPad = navigator.userAgent.match(/iPad/i) != null;
if (isiPad) {
	document.addEventListener('DOMContentLoaded', loaded, false);
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

var decks = {
	familydeck : { 
		nicename : "Family", 
		slug : "familydeck" 
		},
	edeck : { 
		selected : true,
		nicename : "E", 
		slug : "edeck", 
		occupations : Array("45","46","47","48"),
		improvements : Array("49")
		},
	ideck : { 
		nicename : "I", 
		slug : "ideck", 
		occupations : Array("50","53","54","55"),
		improvements : Array("51","52","56","57")
		},
	kdeck : { 
		nicename : "K", 
		slug : "kdeck", 
		occupations : Array("58","60","61","62"),
		improvements : Array("59","63")
		}
};


$(document).ready(function(){

	// Global Variables

	var players = Array(
		// 0: Nicename, 1: Slug, 2: Tokens, 3: Children, 4: Cards, 5: Guests
		Array('Red','red',2,0,Array(),0),
		Array('Blue','blue',2,0,Array(),0),
		Array('Green','green',2,0,Array(),0),
		Array('Purple','purple',2,0,Array(),0),
		Array('Natural Wood','white',2,0,Array(),0)
		);

	var activePlayers = Array();
	var numberofPlayers;
	var startingPlayer;

	var maxFamily = 5;
	var actionsdeck;
	var improvementsDeck;
	var lastAction;


	var oldStartingPlayer = Array();
	var currentRound = 0;
	var currentTurn = 0;

	var turns = Array();


	// Decks
	var roundActions = Array(
		Array('17','18','19','20'),
		Array('21','22','23'),
		Array('24','25'),
		Array('26','27'),
		Array('28','29'),
		Array('30')
		);

	var initialActions = Array(
		Array('01','02','03','04','05','06','07','08','09','13'), //Single Regular
		Array('01','03','04','07','08','09','13','32','33','34'), //Single Fam
		Array('01','02','03','04','05','06','07','08','09','10'), //2 Player Regular
		Array('01','03','04','07','08','09','10','32','33','34'), //2 Player Fam
		Array('01','02','03','04','05','06','07','08','09','10','13','42','43','44'), //3 Player Regular
		Array('01','03','04','07','08','09','10','13','31','32','33','34','42','43'), //3 Player Fam
		Array('01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16'), //4 Player Regular
		Array('01','03','04','07','08','09','10','11','13','14','15','16','31','32','33','34'), //4 Player Fam
		Array('01','02','03','04','05','06','07','08','09','10','35','36','37','38','39','40'), //5 Player Regular
		Array('01','03','04','07','08','09','10','32','33','34','35','36','37','38','40','41') //5 Player Fam
		);


	 Array.prototype.shuffle = function (){
	     var i = this.length, j, temp;
	     if ( i == 0 ) return;
	     while ( --i ) {
	         j = Math.floor( Math.random() * ( i + 1 ) );
	         temp = this[i];
	         this[i] = this[j];
	         this[j] = temp;
	     }
	};



	jQuery.fn.setTokens = function () {
		$(this).find(' > li').remove();
		for ( i = 0; i <= ( turns.length -1 ); i++ ) {
			$(this).append('<li class="' + turns[i][1] + '"><span><span>' + turns[i][0] + '</span></span></li>');
		}
	}
	
	
	jQuery.fn.makeUndoable = function () {

		lastAction = $(this);
		$('.action').removeClass('undoable');		

		if ( $(this).hasClass('action') ) {
			$(this).changeAvailability('unavailable');
		}

		$('#undo').addClass('available');
		updateMoves('next');
	}

	// Fill Screen
	// Used by showWelcome
	jQuery.fn.fillWindow = function () {
		this.css({
			"position" : "fixed",
			"top" : "0px",
			"height" : ( $(window).height() + "px" ),
			"width" : ( $(window).width() + "px" )
			});
		this.show();		
	}

	jQuery.fn.center = function () {

		var $t = ( ( $(window).height() - this.outerHeight() ) / 2);

	    this.css({ "position":"fixed","top" : ($t + "px") });
	    this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
	   	return this;

	}




	jQuery.fn.shuffleCards = function(thisDeck) {
		for (i = 0; i < thisDeck.length; i ++) {
			thisDeck[i].shuffle();
		} 
		return;
	}

	
	// Action Cards

	jQuery.fn.changeAvailability = function (direction) {
		if (direction == "available" ) {
			$(this).show();
			$(this).removeClass('unavailable');
			$(this).addClass('available');
		} else { //unavailable
			$(this).removeClass('available');
			$(this).addClass('unavailable');
			$('.action').removeClass('undoable');
			$(this).addClass('undoable');
		}
	}


	jQuery.fn.stockInventory = function(plus) {
		for (i = 0; i < plus; i++ ) {
			$(this).append('<li><span>Item</span></li>'	 );
		  }
	}


	jQuery.fn.popup = function() {
		this.show();
		$(this).find('.shade').fillWindow();
		$(this).find('.modal').center();
	}

	function cardsSetPlayer() {
		var currentToken = currentTurn - 2;			

		if ( currentToken < 0 ) {
			currentToken = 0;
		}

 		var currentPlayerSlug = turns[currentToken][1];

		$('.cardsplayer li').removeClass('selected')
		$('.cardsplayer ul').find('li.' + currentPlayerSlug).addClass('selected');
		console.log('currentPlayerSlug: '+ currentPlayerSlug );
	}

	function undoAction() {
			if ( $(lastAction).hasClass('startingplayer') ) changeStartingPlayer('undo');			
			if ( $(lastAction).hasClass('familygrowth') ) familyGrowth('undo');
			
			$(lastAction).removeClass('keep1');
			$(lastAction).removeClass('keep2');
			$(lastAction).removeClass('keep3');
			$(lastAction).removeClass('keep4');

			updateMoves('prev');

			$(lastAction).removeClass('undoable');
			$(lastAction).changeAvailability('available');

			$('#undo').removeClass('available');

			console.log('undid ' + lastAction);
	}


	// Moves & Players


	function changeStartingPlayer(undoChange) {

		var cachedStartingPlayer = startingPlayer;

		if ( undoChange == 'undo' ) {

			startingPlayer = oldStartingPlayer;

			if ( cachedStartingPlayer == startingPlayer ) {
				//console.log('Starting Player was not changed from ' + startingPlayer[0] );
			} else {
				//console.log('Starting Player reverted to ' + startingPlayer[0] );				
			}

		} else {
			//console.log('oldStartingPlayer ' + oldStartingPlayer)
			oldStartingPlayer = startingPlayer;
			//console.log('startingPlayer ' + startingPlayer)

			
			var currentToken = currentTurn - 1;			
			var newStartingPlayer = turns[currentToken];
			//console.log('newStartingPlayer ' + newStartingPlayer);

			if ( cachedStartingPlayer !== newStartingPlayer ) {

				var answer = confirm('Make ' + newStartingPlayer[0] + ' Starting Player?')

				if (answer) {
					startingPlayer = newStartingPlayer;
				} 

			} else {
				//console.log('No change: ' + cachedStartingPlayer[0] + ' / '  + newStartingPlayer[0] );
			}

		}

	}

	function updateMoves(direction) {

		if ( direction == 'next' ) {
			currentTurn++;
		} else {
			currentTurn--;
		}

		$('.moves li.current').removeClass('current');

		if ( currentTurn <= turns.length ) {

			var currentToken = currentTurn - 1;			

			$('.moves li:eq('+currentToken+')').addClass('current');

			$('.playerlabel').html( turns[currentToken][0] + '&rsquo;s turn' );	

		} else {

			$('.playerlabel').html( 'Round Over' );		
			$('#skipplayer').removeClass('available');
		}

	}

	// HELPERS

	function doWetNurse() {

		var answer = confirm('Wet Nurse: Click "OK" to Family Growth.');

		if (answer) {

			var currentToken = currentTurn - 1;			
			var growingFamily = turns[currentToken];

			doFamilyGrowth(growingFamily);
			doWetNurse();
		} 
		
	}

	function doFamilyGrowth( growingFamily ) {
		// Used by lover, reedhut, familyGrowth
		if ( growingFamily[2] < maxFamily ) {
			growingFamily[2] ++;
			growingFamily[3] ++;
			console.log( growingFamily[0] + ' grew their family' );
		} else {
			console.log( growingFamily[0] + ' has the maximum family' );
		}
	}


	function doGuest(theplayer) {
		// Used by guest, reedhut

		console.log('theplayer: ' + theplayer);

		$('.moves').append('<li class="' + theplayer[1] + '"><span><span>' + theplayer[0] + '</span></span></li>')
		turns.push(theplayer);
		theplayer[5]++;
		console.log(theplayer[0] + " guests: " + theplayer[5]);
	}


	function familyGrowth(undoGrowth) {
	
		console.log('family growth function');
	

			if ( undoGrowth == 'undo' ) {

				var currentToken = currentTurn - 2;			
				var growingFamily = turns[currentToken];

				growingFamily[2] --;
				growingFamily[3] --;

			} else {

				var currentToken = currentTurn - 1;			
				var growingFamily = turns[currentToken];

				doFamilyGrowth(growingFamily);

			}

		//console.log( growingFamily[0] + ' children: ' + growingFamily[2] );
	
	}

	// Replenish
	function replenish() {

		function showActions(currentRound) {
		
				for ( i = 0; i < initialActions[actionsdeck].length; i++ ) {
					$('#card' + initialActions[actionsdeck][i] ).changeAvailability('available');
				}
		
				var thisround = currentRound - 1;
		
				var cardStack = roundActions[0].concat(roundActions[1], roundActions[2], roundActions[3], roundActions[4], roundActions[5]);
		
				for ( i = 0; i <= thisround; i++ ) {
					$('#card' + cardStack[i] ).removeClass('new');
					$('#card' + cardStack[i] ).changeAvailability('available');
				}

				$('.content .improvement').changeAvailability('available');
				$('.content .occupation').changeAvailability('available');				
		
				$('#card' + cardStack[thisround] ).prependTo('.content').changeAvailability('available');
				$('#card' + cardStack[thisround] ).addClass('new');
				$('#card' + cardStack[thisround] + ' .inventory > li').remove();
			}

		function setTurns() {
			turns = [];
//			console.log('turns length: ' + turns.length);
			var activeTokens = 	function() {
			
					var count = 0;
					for ( i = 0; i < activePlayers.length; i++) {
						count = count + activePlayers[i][2];
					  }
					return count;
				}
	
			var turn = 0;
	
			var k = $.inArray(startingPlayer, activePlayers);
	
			for ( tokenRound = 1; tokenRound <= maxFamily; tokenRound++ ) {
	
				for ( j = 0; j < numberofPlayers; j++ ) {
					if ( activePlayers[k][2] < tokenRound ) {
						//console.log( activePlayers[k][0] + " is out of tokens: " + activePlayers[k][2] )
					} else {
						//console.log( activePlayers[k][0] + " has tokens: " + activePlayers[k][2] )
						
						turns[turn] = activePlayers[k];
						//console.log("Turn " + turn + ': ' + turns[turn] )
						turn++;
	
					}

					if ( k < (activePlayers.length - 1) ) {
						k++;				
					} else {
						k = 0;
					}
	
				}
	
				var j = 0;
	
			}
		}


		function updateRound(currentRound) {
	
			var thisround = currentRound - 1;
	
			for ( count = 0; count < thisround; count++ ) {
				$('.roundcounter li:eq(' + count + ')').removeClass('currentround');
			}
		
			$('.roundcounter li:eq(' + thisround + ')').addClass('currentround');
	
		}

		function harvestAlert(currentRound) {

			function calculateFood(message){

				var message = message + ' \n';

				for ( i = 0; i < activePlayers.length ; i++ ) {

					if ( activePlayers.length > 1 ) {
						var foodrate = 2;
					} else {
						var foodrate = 3;
					}

					var name = activePlayers[i][0];
					var tokens = activePlayers[i][2];
					var offspring = activePlayers[i][3];

					var food = (tokens * foodrate) - offspring;

					message += name + ': ' + food + ' food. \n';

				}

				alert(message);

				resetOffspring();
			}

			function resetOffspring(){
				for ( i = 0; i < activePlayers.length ; i++ ) {
					activePlayers[i][3] = 0;
					console.log(activePlayers[i][0] + " offspring: " + activePlayers[i][3]);
				}
			}
		

			switch (currentRound) {
				case 5:
					calculateFood('Harvest time!');
				break;
				case 8:
					calculateFood('Harvest time!');
				break;
				case 10:
					calculateFood('Harvest time!');
				break;
				case 12:
					calculateFood('Harvest time!');
				break;
				case 14:
					calculateFood('Harvest time!');
				break;
				case 15:
					calculateFood('Final Harvest!');
				break;
			}
		}


		currentRound ++;
		currentTurn = 0;

		harvestAlert(currentRound);


		$('.unavailable .inventory > li').remove();

		showActions(currentRound);

		$('.plus1 .inventory').stockInventory(1);
		$('.plus2 .inventory').stockInventory(2);
		$('.plus3 .inventory').stockInventory(3);
		$('.plus4 .inventory').stockInventory(4);

		$('.keep1 .inventory').stockInventory(1);
		$('.keep2 .inventory').stockInventory(2);
		$('.keep3 .inventory').stockInventory(3);
		$('.keep4 .inventory').stockInventory(4);

		$('.action').removeClass('keep1');
		$('.action').removeClass('keep2');
		$('.action').removeClass('keep3');
		$('.action').removeClass('keep4');

		updateRound(currentRound);

		$('.action').removeClass('undoable');

		setTurns();
		$('.moves').setTokens();

		oldStartingPlayer = startingPlayer;

		currentPlayer = 0;

		$('#skipplayer').addClass('available');
		updateMoves('next');

	  	$('.content').masonry({ itemSelector : '.action' });

	}


	function showWelcome(){

		function constructDeckSwitch(){
			var html = '';

			var selectedFlag = function (prop) {
				if (prop) {
					return ' selected';
				} else {
					return '';
				}
			}

			for (var prop in decks) {    
				html += '<a class="'+ decks[prop].slug + selectedFlag(decks[prop].selected) + '">' + decks[prop].nicename + '</a> ';    
			}    
			  
			$('.playersettings').after('<p class="deckswitch"><span>Deck:</span> ' + html + '</p>');
		}



		function startGame(){
		
				function loadInitialActions() {
					for ( i = 0; i < initialActions[actionsdeck].length; i++ ) {
						$('#card' + initialActions[actionsdeck][i] ).prependTo('.content').changeAvailability('available');
					}
				}
		
				function setPlayers(){
				
					$('.playerselect .selected').each(function(i) {
			
						var color;
			
						if ( $(this).hasClass('red') ) {
							color =	0;
						} else if ( $(this).hasClass('green') ) {
							color =	2;
						} else if ( $(this).hasClass('blue') ) {
							color =	1;			
						} else if ( $(this).hasClass('white') ) {
							color =	4;
						} else {
							color =	3;
						}
			
						activePlayers.push(players[color]);
			
					});
			
					numberofPlayers = activePlayers.length;
					startingPlayer = activePlayers[0];
					
				}
		

				function setDeck(numberofPlayers) {
					$('.deckswitch .selected').each(function (i) {

						if ( $(this).hasClass('familydeck') ) { // Family Style

							switch (numberofPlayers) {
								case 1: actionsdeck = 1; break;
								case 2: actionsdeck = 3; break;
								case 3: actionsdeck = 5; break;
								case 4: actionsdeck = 7; break;
								case 5: actionsdeck = 9; break;
							}
							
							improvementsDeck = decks.familydeck;
							$('#cardsbutton').hide();

						} else {

							switch (numberofPlayers) {
								case 1: actionsdeck = 0; break;
								case 2: actionsdeck = 2; break;
								case 3: actionsdeck = 4; break;
								case 4: actionsdeck = 6; break;
								case 5: actionsdeck = 8; break;
							}

							if ( $(this).hasClass('edeck') ) { // E Deck
								improvementsDeck = decks.edeck;
							} else if ( $(this).hasClass('ideck') ) { // I Deck
								improvementsDeck = decks.ideck;
							} else if ( $(this).hasClass('kdeck') ) { // K Deck
								improvementsDeck = decks.kdeck;
							} else {
								console.log('Deck selection error');
							}

						}
					});

				}

				function populateCards() {
					// Populate Players
					for ( i = 0; i < activePlayers.length; i++) {
						$('.cardsplayer').find('ul').append('<li class="' + activePlayers[i][1] + '" title="' + activePlayers[i][1] + '"><span><span>' + activePlayers[i][0] + '</span></span></li>');
					}
					
					// Populate Cards
				
					console.log('improvementsDeck: ' + improvementsDeck);
					console.log('improvementsDeck.occupations: ' + improvementsDeck.occupations);
					console.log('improvementsDeck.improvements: ' + improvementsDeck.improvements);
					
					$('.modalcards').append('<h4>Occupations:</h4>');

					for (var i = 0; i < improvementsDeck.occupations.length; i++) {
						mytitle = $("#card" + improvementsDeck.occupations[i]).attr('title')
						$('.modalcards').append('<a title="' + improvementsDeck.occupations[i] + '" id="cardbutton' + improvementsDeck.occupations[i] + '" class="card">' + mytitle + '</a>');
					}

					$('.modalcards').append('<h4>Minor Improvements:</h4>');

					for (var i = 0; i < improvementsDeck.improvements.length; i++) {
						mytitle = $("#card" + improvementsDeck.improvements[i]).attr('title')
						$('.modalcards').append('<a title="' + improvementsDeck.improvements[i] + '" id="cardbutton' + improvementsDeck.improvements[i] + '" class="card">' + mytitle + '</a>');
					}
				}

				setPlayers();
				setDeck(numberofPlayers);			
				populateCards();

				$('.plus1').append('<ol class="inventory">');
				$('.plus2').append('<ol class="inventory">');
				$('.plus3').append('<ol class="inventory">');
				$('.plus4').append('<ol class="inventory">');
		
			  	$('#wrapper').css({ 'top' : $('.turnkeeper').outerHeight(),
									'bottom' : $('#footer').outerHeight() 
								});
		
				$(document).shuffleCards(roundActions);
		
				loadInitialActions();
				replenish();
				
			}



		var welcomescreen = $('#welcomescreen');
		$(welcomescreen).fillWindow();


		$('.playerselect li').click(function() {
			
			jQuery.fn.deselectColor = function () {
				var color;
				if ( this.hasClass('red') ) {
					color =	'red';
				} else if ( this.hasClass('green') ) {
					color =	'green';
				} else if ( this.hasClass('blue') ) {
					color =	'blue';			
				} else if ( this.hasClass('white') ) {
					color =	'white';
				} else {
					color =	'purple';
				}
		
				$(this).parents('.playersettings').find('.' + color).removeClass('selected');					
				$(this).siblings('li').removeClass('selected');
		
			}


			if ( $(this).hasClass('selected') ) {
				$(this).removeClass('selected');
			} else {
				$(this).deselectColor();
				$(this).addClass('selected');
			}
		});

		constructDeckSwitch();

		$('.deckswitch a').click( function(event) {
			$(this).siblings().removeClass('selected');
			$(this).addClass('selected');
		});



		$('.startgame').click(function() {
			$(welcomescreen).hide();
			startGame();
		});



	}


	function playImprovementCard( thecardwereadding, theaffectedplayer ) {
		console.log('this will affect ' + theaffectedplayer);
		console.log("this will add " + thecardwereadding );

		function addActionCard(card,playername) {
			card.changeAvailability('available');
			card.find('strong').html(playername);
			$('.content').prepend(card).masonry( 'appended', card );
		}

		// CARDS

		function storyteller() {
			// card 45
			console.log("this will add storyteller" );
			activePlayers[theaffectedplayer][4].push(45);
		}

		function mushroomcollector() {
			// card 46
			console.log("this will add mushroomcollector" );

		 	var playername = activePlayers[theaffectedplayer][0];
			console.log('this affects ' + playername);
			activePlayers[theaffectedplayer][4].push(46);
		}

		function masterforester() {
			// card 47
			console.log("this will add masterforester" );
			activePlayers[theaffectedplayer][4].push(47);			

			var card = $('#card47');
		 	var playername = activePlayers[theaffectedplayer][0];
			addActionCard( card, playername);
			$('#card47 .inventory li').remove();
		}

		function headofthefamily() {
			// card 48
			console.log("this will add headofthefamily" );
			activePlayers[theaffectedplayer][4].push(48);			
			var card = $('#card48');
		 	var playername = activePlayers[theaffectedplayer][0];
			addActionCard( card, playername);
		}

		function basket() {
			// card 49
			console.log("this will add basket" );
			activePlayers[theaffectedplayer][4].push(49);			
		}

		function pigcatcher() {
			// card 50
			console.log("this will add pigcatcher" );
			activePlayers[theaffectedplayer][4].push(50);			
		}

		function guest() {
			// card 51
			console.log("this will add Guest" );
			// activePlayers[theaffectedplayer][4].push(51); Do not hold this card
			doGuest(activePlayers[theaffectedplayer]);
		}

		function lasso() {
			// card 52
			console.log("this will add Lasso" );
			activePlayers[theaffectedplayer][4].push(52);
		}

		function claydigger() {
			// card 55
			console.log("this will add Clay Digger" );
			activePlayers[theaffectedplayer][4].push(55);			

			var card = $('#card55');
		 	var playername = activePlayers[theaffectedplayer][0];
			addActionCard( card, playername);
			$('#card55 .inventory').append('<li><span>Item</span></li>');
			$('#card55 .inventory').append('<li><span>Item</span></li>');
		}
		
		function claydeposit() {
			// card 56
			console.log("this will add Clay Deposit" );
			activePlayers[theaffectedplayer][4].push(56);			

			var card = $('#card56');
		 	var playername = activePlayers[theaffectedplayer][0];
			addActionCard( card, playername);

		}

		function tavern() {
			// card 57
			console.log("this will add Tavern" );
			activePlayers[theaffectedplayer][4].push(57);			

			var card = $('#card57');
		 	var playername = activePlayers[theaffectedplayer][0];
			addActionCard( card, playername);

		}


		function lover() {
			// card 58
			console.log("this will add Lover" );
			activePlayers[theaffectedplayer][4].push(58);			

			var growingFamily = activePlayers[theaffectedplayer];
			doFamilyGrowth(growingFamily);

		}

		function reedhut() {
			// card 59
			console.log("this will add Reed Hut" );
			activePlayers[theaffectedplayer][4].push(59);			

			var growingFamily = activePlayers[theaffectedplayer];
			doFamilyGrowth(growingFamily);
			doGuest(activePlayers[theaffectedplayer]);
		}

		function adoptiveparents() {
			// card 60
			console.log("this will add Adoptive Parents" );
			activePlayers[theaffectedplayer][4].push(60);			
		}

		function wetnurse() {
			// card 61
			console.log("this will add Wet Nurse" );
			activePlayers[theaffectedplayer][4].push(61);			
		}

		function sleepingcorner() {
			// card 63
			console.log("this will add Sleeping Corner" );
			activePlayers[theaffectedplayer][4].push(63);			

			var card = $('#card63');
		 	var playername = activePlayers[theaffectedplayer][0];
			addActionCard( card, playername);

		}




		if ( thecardwereadding == 45  ) storyteller();
		if ( thecardwereadding == 46 ) mushroomcollector(); 
		if ( thecardwereadding == 47 ) masterforester();
		if ( thecardwereadding == 48 ) headofthefamily();
		if ( thecardwereadding == 49 ) basket();
		if ( thecardwereadding == 50 ) pigcatcher();
		if ( thecardwereadding == 51 ) guest();
		if ( thecardwereadding == 52 ) lasso();
		if ( thecardwereadding == 55 ) claydigger();
		if ( thecardwereadding == 56 ) claydeposit();
		if ( thecardwereadding == 57 ) tavern();
		if ( thecardwereadding == 58 ) lover();
		if ( thecardwereadding == 59 ) reedhut();
		if ( thecardwereadding == 60 ) adoptiveparents();
		if ( thecardwereadding == 61 ) wetnurse();
		if ( thecardwereadding == 63 ) sleepingcorner();


			
	}

	function returnCurrentPlayer() {
		var currentToken = currentTurn - 1;			
		console.log('currentToken is ' + currentToken);
		return turns[currentToken];
	}

	
	// jQuery Clicks

	$('.action').click(function() {

		var currentPlayer = returnCurrentPlayer();
		console.log("the currentPlayer is " + currentPlayer[0]);

		var numberofcards = currentPlayer[4].length;
		console.log("the currentPlayer has this many cards: " + numberofcards );
		
		for (var i = 0; i < currentPlayer[4].length; i++) {
			console.log("card: " + currentPlayer[4][i] );
		}



		if ( $(this).hasClass('available') ) {

			// card 45, storyteller
			if ( jQuery.inArray(45, currentPlayer[4] ) > -1 ) {
				console.log('player has soryteller');

				if ( $(this).is('#card16') || $(this).is('#card36') ) {
					console.log('soryteller is an option here');

					var answer = confirm('Do you want to leave 1 Food and receive 1 Vegetable in exchange?')

					if (answer) {
						console.log('they took the veg!')
						$(this).addClass('keep1');
					} else {
						console.log('what, no oven?');
					}
					
				}
			
			}


			// card 46, Mushroom Collector
			if ( jQuery.inArray(46, currentPlayer[4] ) > -1 ) {

				console.log('player has Mushroom Collector');
				
				if ( $(this).hasClass('wood') || $(this).is('#card31') || $(this).is('#card34') || $(this).is('#card37') || $(this).is('#card41') || $(this).is('#card42') ) {

					console.log('Mushroom Collector is an option here');

					var answer = confirm('Do you want to leave 1 Wood and receive 2 Food in exchange?')

					if (answer) {
						console.log('they took the wood!')
						if ( $(this).hasClass('wood') ) $(this).addClass('keep1');
					} else {
						console.log('didnt take');
					}
					
				}
		
			}


			// card 49, Basket
			if ( jQuery.inArray(49, currentPlayer[4] ) > -1 ) {

				console.log('player has Basket');
				
				if ( $(this).hasClass('wood') && $(this).find('li').length > 1 ) var hasthewood = true;
				
				if ( hasthewood || $(this).is('#card31') || $(this).is('#card41') ) {

					console.log('Basket is an option here');

					var answer = confirm('Do you want to leave 2 Wood and receive 3 Food in exchange?')

					if (answer) {
						console.log('they took the wood!')
						if ( $(this).hasClass('wood') ) $(this).addClass('keep2');
					} else {
						console.log('didnt take');
					}
					
				}
		
			}


			// card 50, Pig Catcher
			if ( jQuery.inArray(50, currentPlayer[4] ) > -1 ) {

				console.log('player has Pig Catcher');
				
				if ( $(this).hasClass('wood') && $(this).find('li').length > 1 ) var hasthewood = true;
				
				if ( hasthewood || $(this).is('#card31') || $(this).is('#card41') ) {

					console.log('Pig Catcher is an option here');

					var answer = confirm('Do you want to leave 2 Wood and receive a Wild Boar in exchange?');

					if (answer) {
						console.log('they took the wood!');
						if ( $(this).hasClass('wood') ) $(this).addClass('keep2');
					} else {
						console.log('didnt take');
					}
					
				}
		
			}

			// card 52, Lasso
			if ( jQuery.inArray(52, currentPlayer[4] ) > -1 ) {

				console.log('player has Lasso');
				
				if ( $(this).hasClass('animal') ) {

					console.log('Lasso is an option here');

					var eligibleTokens = false;
					var currentIndex = $('.moves li.current').index();
					console.log('current index: ' + currentIndex);

					$('.moves li').each(function(index) {
						if  ( $(this).hasClass(currentPlayer[1]) ) {
							if ( index > currentIndex ) {
								eligibleTokens = true;
							}
						}
					});

					if (eligibleTokens == true) {
						$('.moves .' + currentPlayer[1]).last().insertAfter('.moves li:eq(' + currentIndex + ')');
						alert('Lasso: You took an animal, so go again.');						
					}

				}
		
			}



			// card 61, Wet Nurse
			if ( jQuery.inArray(61, currentPlayer[4] ) > -1 ) {

				console.log('player has Wet Nurse');
				
				if ( $(this).hasClass('build') ) {

					console.log('Wet Nurse is an option here');

					doWetNurse();
					
				}
		
			}


			if ( $(this).hasClass('startingplayer') ) changeStartingPlayer();			

			if ( $(this).hasClass('familygrowth') ) {


				if ( $(this).is('#card48') ) {
					// card 48, Head of the Family
					if ( jQuery.inArray(48, currentPlayer[4] ) > -1 ) {

						var answer = confirm('Click "OK" to Family Growth.');

						if (answer) familyGrowth();
				
					} else {
						alert("That isn't your card. Please undo.");
					}

				} else if ( jQuery.inArray(59, currentPlayer[4] ) > -1 ) {
				// card 59, Reed Hut
				
					var newanswer = confirm('Click "OK" to move a family member from your Reed Hut into your home. (Click "Cancel" if you want to family growth.)');

					if (newanswer) {
						var idx = currentPlayer[4].indexOf(59); // Find the index
						currentPlayer[4].remove(idx);
					}

					var answer = confirm('Click "OK" to Family Growth.');

					if (answer) familyGrowth();

				} else if ( jQuery.inArray(60, currentPlayer[4] ) > -1 ) {
				// card 60, Adoptive Parents

					familyGrowth();
					
					var answer = confirm('Adoptive Parents: Click "OK" to pay 1 Food to use this offspring this round.');

					if (answer) {
						console.log('currentPlayer: ' + currentPlayer);
						doGuest(currentPlayer);
						currentPlayer[3]--;
					}


				} else if ( $(this).is('#card63') ) {
					// card 63, Sleeping Corner
					if ( jQuery.inArray(63, currentPlayer[4] ) > -1 ) {

						familyGrowth();
					
					} else {
						alert("That isn't your card. Please undo.");
					}

				} else if ( $(this).is('#card39') || $(this).is('#card41') ) {
					if ( currentRound > 4) {
						var answer = confirm('Click "OK" to Family Growth.');
						if (answer) familyGrowth();						
					}
				} else {
									
					familyGrowth();
				}
				
			}

			$(this).makeUndoable();

		} else if ( $(this).hasClass('undoable') ) {

			undoAction();

		}
	});	

	$('.replenish').click(function() {
		replenish();
	  	$('.content').masonry('reload');
	});

	$('.skipplayer').click(function() {
		if ( currentTurn <= turns.length ) {
			$(this).makeUndoable();
		}
	});

	$('#undo').click(function() {

		if ( $(this).hasClass('available') ) {		
			console.log('Undo it!');
			undoAction();
		}

	});

	$('#cardsbutton').click(function() {
		cardsSetPlayer();
		$('#cardswindow').popup();
	});

	$('.popup').find('.shade').click(function() {
		$(this).parents('.popup').hide();
//		console.log('got the shade click');
	});

	$('.popup').find('.cancel').click(function() {
		$(this).parents('.popup').hide();
	});
	
	$('.cardsplayer ul').delegate("span", "click", function() {
	  $('.cardsplayer').find('li').removeClass("selected");
	  $(this).parent('li').addClass("selected");
	});

	$('#cardswindow').delegate("a", "click", function() {

		$(this).parents('.popup').hide();
		
		var thecardwereadding = $(this).attr('title');
		var theaffectedplayer = $('.cardsplayer ul li.selected').index();
		playImprovementCard(thecardwereadding,theaffectedplayer);


	});	
		
	// Let's go!

	showWelcome();

});