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



var decks = {
	familydeck : { 
		nicename : "Family", 
		slug : "familydeck", 
		occupations : Array(),
		improvements : Array()
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
		Array('Red','red',2,0),
		Array('Blue','blue',2,0),
		Array('Green','green',2,0),
		Array('Purple','purple',2,0),
		Array('Natural Wood','white',2,0)
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
			if ( $(lastAction).hasClass('startingplayer') ) {
				changeStartingPlayer('undo');			
			} else if ( $(lastAction).hasClass('familygrowth') ) {
				familyGrowth('undo');			
			}

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

	function familyGrowth(undoGrowth) {
	
		console.log('family growth function');
	
		if ( currentRound > 4) {

			if ( undoGrowth == 'undo' ) {

				var currentToken = currentTurn - 2;			
				var growingFamily = turns[currentToken];

				growingFamily[2] --;
				growingFamily[3] --;

			} else {

				var currentToken = currentTurn - 1;			
				var growingFamily = turns[currentToken];

				if ( growingFamily[2] < maxFamily ) {
					growingFamily[2] ++;
					growingFamily[3] ++;
				} else {
					//console.log( growingFamily[0] + ' has the maximum family' );
				}

			}

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
		
				$('#card' + cardStack[thisround] ).prependTo('.content').changeAvailability('available');
				$('#card' + cardStack[thisround] ).addClass('new');
				$('#card' + cardStack[thisround] + ' .inventory > li').remove();
			}

		function setTurns() {
	
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
//					console.log('k: ' + k);
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
						$('.cardsplayer').find('ul').append('<li class="' + activePlayers[i][1] + '"><span><span>' + activePlayers[i][0] + '</span></span></li>');
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
						$('.modalcards').append('<a title="' + improvementsDeck.occupations[i] + '" id="cardbutton' + improvementsDeck.improvements[i] + '" class="card">' + mytitle + '</a>');
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


	function playImprovemntCard( thecardwereadding ) {
		console.log("this will add " + thecardwereadding );
		
	}


	// jQuery Clicks

	$('.action').click(function() {

		if ( $(this).hasClass('available') ) {

			if ( $(this).hasClass('startingplayer') ) {
				changeStartingPlayer();			
			} else if ( $(this).hasClass('familygrowth') ) {
				console.log('family growth clicked');
				familyGrowth();
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
//		console.log('got the cancel click');
	});
	
	$('.cardsplayer ul').delegate("span", "click", function() {
	  $('.cardsplayer').find('li').removeClass("selected");
	  $(this).parent('li').addClass("selected");
	});

	$('#cardswindow').delegate("a", "click", function() {
		$(this).hide();
		$(this).parents('.popup').hide();
		

		var thecardwereadding = $(this).attr('title');
		console.log('thecardwereadding is ' + thecardwereadding);
		playImprovemntCard(thecardwereadding);

	});

	
		
	// Let's go!

	showWelcome();

});