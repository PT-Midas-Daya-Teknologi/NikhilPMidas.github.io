(function ($) {

	"use strict";

	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if ($('.loader-wrap').length) {
			$('.loader-wrap').delay(1000).fadeOut(500);
		}
	}

	if ($(".preloader-close").length) {
		$(".preloader-close").on("click", function () {
			$('.loader-wrap').delay(200).fadeOut(500);
		})
	}

	//Update Header Style and Scroll to Top
	function headerStyle() {
		if ($('.main-header').length) {
			var windowpos = $(window).scrollTop();
			var siteHeader = $('.main-header');
			var scrollLink = $('.scroll-top');
			if (windowpos >= 110) {
				siteHeader.addClass('fixed-header');
				scrollLink.addClass('open');
			} else {
				siteHeader.removeClass('fixed-header');
				scrollLink.removeClass('open');
			}
		}
	}

	headerStyle();


	//Mobile Nav Hide Show
	function setupMobileMenu() {
		if ($('.mobile-menu').length) {

			// Submenu Dropdown Toggle
			if ($('.main-header li.dropdown ul').length) {
				$('.main-header .navigation li.dropdown').each(function () {
					if (!$(this).find('> .dropdown-btn').length) {
						$(this).append('<div class="dropdown-btn"><span class="fas fa-angle-down"></span></div>');
					}
				});
			}

			$('.mobile-menu .menu-box');

			var mobileMenuContent = $('.main-header .menu-area .main-menu').html();
			$('.mobile-menu .menu-box .menu-outer').html(mobileMenuContent);
			$('.sticky-header .main-menu').html(mobileMenuContent);

			//Dropdown Button
			$('.mobile-menu li.dropdown .dropdown-btn').on('click', function () {
				$(this).toggleClass('open');
				$(this).prev('ul').slideToggle(500);
			});
			//Dropdown Button
			$('.mobile-menu li.dropdown .dropdown-btn').on('click', function () {
				$(this).prev('.megamenu').slideToggle(900);
			});

			//Menu Toggle Btn
			$('.mobile-nav-toggler').on('click', function () {
				$('body').addClass('mobile-menu-visible');
			});

			//Menu Close Btn
			$('.mobile-menu .menu-backdrop,.mobile-menu .close-btn').on('click', function () {
				$('body').removeClass('mobile-menu-visible');
			});
		}
	}


	// Scroll to a Specific Div
	if ($('.scroll-to-target').length) {
		$(".scroll-to-target").on('click', function () {
			var target = $(this).attr('data-target');
			// animate
			$('html, body').animate({
				scrollTop: $(target).offset().top
			}, 1000);

		});
	}

	// Elements Animation
	if ($('.wow').length) {
		var wow = new WOW({
			mobile: false
		});
		wow.init();
	}

	//Contact Form Validation
	if ($('#contact-form').length) {
		$('#contact-form').validate({
			rules: {
				username: {
					required: true
				},
				email: {
					required: true,
					email: true
				},
				phone: {
					required: true
				},
				subject: {
					required: true
				},
				message: {
					required: true
				}
			}
		});
	}

	//Fact Counter + Text Count
	if ($('.count-box').length) {
		$('.count-box').appear(function () {

			var $t = $(this),
				n = $t.find(".count-text").attr("data-stop"),
				r = parseInt($t.find(".count-text").attr("data-speed"), 10);

			if (!$t.hasClass("counted")) {
				$t.addClass("counted");
				$({
					countNum: $t.find(".count-text").text()
				}).animate({
					countNum: n
				}, {
					duration: r,
					easing: "linear",
					step: function () {
						$t.find(".count-text").text(Math.floor(this.countNum));
					},
					complete: function () {
						$t.find(".count-text").text(this.countNum);
					}
				});
			}

		}, { accY: 0 });
	}


	// Progress Bar
	if ($('.count-bar').length) {
		$('.count-bar').appear(function () {
			var el = $(this);
			var percent = el.data('percent');
			$(el).css('width', percent).addClass('counted');
		}, { accY: -50 });

	}


	//LightBox / Fancybox
	if ($('.lightbox-image').length) {
		$('.lightbox-image').fancybox({
			openEffect: 'fade',
			closeEffect: 'fade',
			helpers: {
				media: {}
			}
		});
	}


	//Tabs Box
	if ($('.tabs-box').length) {
		$('.tabs-box .tab-buttons .tab-btn').on('click', function (e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));

			if ($(target).is(':visible')) {
				return false;
			} else {
				target.parents('.tabs-box').find('.tab-buttons').find('.tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				target.parents('.tabs-box').find('.tabs-content').find('.tab').fadeOut(0);
				target.parents('.tabs-box').find('.tabs-content').find('.tab').removeClass('active-tab');
				$(target).fadeIn(100);
				$(target).addClass('active-tab');
			}
		});
	}



	//Accordion Box
	if ($('.accordion-box').length) {
		$(".accordion-box").on('click', '.acc-btn', function () {

			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');

			if ($(this).hasClass('active') !== true) {
				$(outerBox).find('.accordion .acc-btn').removeClass('active');
			}

			if ($(this).next('.acc-content').is(':visible')) {
				return false;
			} else {
				$(this).addClass('active');
				$(outerBox).children('.accordion').removeClass('active-block');
				$(outerBox).find('.accordion').children('.acc-content').slideUp(300);
				target.addClass('active-block');
				$(this).next('.acc-content').slideDown(300);
			}
		});
	}


	// banner-carousel
	if ($('.banner-carousel').length) {
		$('.banner-carousel').owlCarousel({
			loop: true,
			margin: 0,
			nav: true,
			animateOut: 'fadeOut',
			animateIn: 'fadeIn',
			active: true,
			smartSpeed: 1000,
			autoplay: 6000,
			navText: ['<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>'],
			responsive: {
				0: {
					items: 1
				},
				600: {
					items: 1
				},
				800: {
					items: 1
				},
				1024: {
					items: 1
				}
			}
		});
	}


	// single-item-carousel
	if ($('.single-item-carousel').length) {
		$('.single-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: ['<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>'],
			responsive: {
				0: {
					items: 1
				},
				480: {
					items: 1
				},
				600: {
					items: 1
				},
				800: {
					items: 1
				},
				1200: {
					items: 1
				}

			}
		});
	}


	// two-item-carousel
	if ($('.two-item-carousel').length) {
		$('.two-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: ['<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>'],
			responsive: {
				0: {
					items: 1
				},
				480: {
					items: 1
				},
				600: {
					items: 1
				},
				800: {
					items: 2
				},
				1200: {
					items: 2
				}

			}
		});
	}


	// three-item-carousel
	if ($('.three-item-carousel').length) {
		$('.three-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: ['<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>'],
			responsive: {
				0: {
					items: 1
				},
				480: {
					items: 1
				},
				600: {
					items: 2
				},
				800: {
					items: 2
				},
				1200: {
					items: 3
				}

			}
		});
	}


	// four-item-carousel
	if ($('.four-item-carousel').length) {
		$('.four-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: ['<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>'],
			responsive: {
				0: {
					items: 1
				},
				480: {
					items: 1
				},
				600: {
					items: 2
				},
				800: {
					items: 3
				},
				1200: {
					items: 4
				}

			}
		});
	}


	// project-carousel
	if ($('.project-carousel').length) {
		$('.project-carousel').owlCarousel({
			loop: true,
			margin: 0,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: ['<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>'],
			responsive: {
				0: {
					items: 1
				},
				480: {
					items: 1
				},
				600: {
					items: 2
				},
				800: {
					items: 3
				},
				1200: {
					items: 4
				}

			}
		});
	}


	// five-item-carousel
	if ($('.five-item-carousel').length) {
		$('.five-item-carousel').owlCarousel({
			loop: true,
			margin: 30,
			nav: true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: ['<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>'],
			responsive: {
				0: {
					items: 1
				},
				480: {
					items: 2
				},
				600: {
					items: 3
				},
				800: {
					items: 4
				},
				1200: {
					items: 5
				}

			}
		});
	}



	//Add One Page nav
	if ($('.scroll-nav').length) {
		$('.scroll-nav').onePageNav();
	}


	// page direction
	function directionswitch() {
		if ($('.page_direction').length) {

			$('.direction_switch button').on('click', function () {
				$('body').toggleClass(function () {
					return $(this).is('.rtl, .ltr') ? 'rtl ltr' : 'rtl';
				})
			});
		};
	}


	//nice select
	$(document).ready(function () {
		$('select:not(.ignore)').niceSelect();
	});

	//ScrollAnimations
	$(document).ready(function () {
		var $containers = $('[data-animation]:not([data-animation-text]), [data-animation-box]');
		if ($containers.length && $.isFunction($.fn.scrollAnimations)) {
			$containers.scrollAnimations();
		}
	});


	if ($('.testimonial-section .bxslider').length) {
		$('.testimonial-section .bxslider').bxSlider({
			nextText: '<i class="icon-22"></i>',
			prevText: '<i class="icon-21"></i>',
			mode: 'fade',
			auto: 'true',
			speed: '700',
			pagerCustom: '.testimonial-section .slider-pager .thumb-box'
		});
	};

	if ($('.testimonial-style-two .bxslider').length) {
		$('.testimonial-style-two .bxslider').bxSlider({
			nextText: '<i class="icon-22"></i>',
			prevText: '<i class="icon-21"></i>',
			mode: 'fade',
			auto: 'true',
			speed: '700',
			pagerCustom: '.testimonial-style-two .slider-pager .thumb-box'
		});
	};


	//Search Popup
	if ($('#search-popup').length) {

		//Show Popup
		$('.search-toggler').on('click', function () {
			$('#search-popup').addClass('popup-visible');
		});
		$(document).keydown(function (e) {
			if (e.keyCode === 27) {
				$('#search-popup').removeClass('popup-visible');
			}
		});
		//Hide Popup
		$('.close-search,.search-popup .overlay-layer').on('click', function () {
			$('#search-popup').removeClass('popup-visible');
		});
	}


	// Scroll top button
	$('.scroll-top-inner').on("click", function () {
		$('html, body').animate({ scrollTop: 0 }, 500);
		return false;
	});


	function handleScrollbar() {
		const bHeight = $('body').height();
		const scrolled = $(window).innerHeight() + $(window).scrollTop();

		let percentage = ((scrolled / bHeight) * 100);

		if (percentage > 100) percentage = 100;

		$('.scroll-top-inner .bar-inner').css('width', percentage + '%');
	}


	//Sortable Masonary with Filters
	function enableMasonry() {
		if ($('.sortable-masonry').length) {

			var winDow = $(window);
			// Needed variables
			var $container = $('.sortable-masonry .items-container');
			var $filter = $('.filter-btns');

			$container.isotope({
				filter: '*',
				masonry: {
					columnWidth: '.masonry-item.small-column'
				},
				animationOptions: {
					duration: 500,
					easing: 'linear'
				}
			});


			// Isotope Filter 
			$filter.find('li').on('click', function () {
				var selector = $(this).attr('data-filter');

				try {
					$container.isotope({
						filter: selector,
						animationOptions: {
							duration: 500,
							easing: 'linear',
							queue: false
						}
					});
				} catch (err) {

				}
				return false;
			});


			winDow.on('resize', function () {
				var selector = $filter.find('li.active').attr('data-filter');

				$container.isotope({
					filter: selector,
					animationOptions: {
						duration: 500,
						easing: 'linear',
						queue: false
					}
				});
			});


			var filterItemA = $('.filter-btns li');

			filterItemA.on('click', function () {
				var $this = $(this);
				if (!$this.hasClass('active')) {
					filterItemA.removeClass('active');
					$this.addClass('active');
				}
			});
		}
	}

	enableMasonry();


	if ($('.timer').length) {
		$(function () {
			$('[data-countdown]').each(function () {
				var $this = $(this), finalDate = $(this).data('countdown');
				$this.countdown(finalDate, function (event) {
					$this.html(event.strftime('%D days %H:%M:%S'));
				});
			});
		});

		$('.cs-countdown').countdown('').on('update.countdown', function (event) {
			var $this = $(this).html(event.strftime('<div class="count-col"><span>%D</span><h6>days</h6></div> <div class="count-col"><span>%H</span><h6>Hours</h6></div> <div class="count-col"><span>%M</span><h6>Minutes</h6></div> <div class="count-col"><span>%S</span><h6>Seconds</h6></div>'));
		});
	}



	/*	=========================================================================
	When document is Scrollig, do
	========================================================================== */

	jQuery(document).on('ready', function () {
		(function ($) {
			// add your functions
			directionswitch();
			enableMasonry();
		})(jQuery);
	});



	/* ==========================================================================
   When document is Scrollig, do
   ========================================================================== */

	$(window).on('scroll', function () {
		headerStyle();
		handleScrollbar();
		if ($(window).scrollTop() > 200) {
			$('.scroll-top-inner').addClass('visible');
		} else {
			$('.scroll-top-inner').removeClass('visible');
		}
	});



	/* ==========================================================================
   When document is loaded, do
   ========================================================================== */

	// Load components
	$(window).on('load', function () {
		handlePreloader();

		// Determine base path for components
		var pathParts = window.location.pathname.split('/');
		var lastFolder = pathParts[pathParts.length - 2];
		var subfolders = ['home', 'about', 'services', 'products', 'ai', 'career', 'contact', 'component', 'blog', 'portfolio'];
		var isSubfolder = subfolders.indexOf(lastFolder) !== -1;
		var basePath = isSubfolder ? '../' : '';

		function fixPaths(container) {
			if (isSubfolder) {
				$(container).find('a').each(function () {
					var href = $(this).attr('href');
					if (href && href.startsWith('/')) {
						$(this).attr('href', basePath + href.substring(1));
					}
				});
				$(container).find('img').each(function () {
					var src = $(this).attr('src');
					if (src && src.startsWith('/')) {
						$(this).attr('src', basePath + src.substring(1));
					}
				});
				$(container).find('[style*="url(/"]').each(function () {
					var style = $(this).attr('style');
					if (style) {
						$(this).attr('style', style.replace(/url\(\//g, 'url(' + basePath));
					}
				});
			} else {
				// If at root, just remove the leading slash for local relative paths
				$(container).find('a').each(function () {
					var href = $(this).attr('href');
					if (href && href.startsWith('/')) {
						$(this).attr('href', href.substring(1));
					}
				});
				$(container).find('img').each(function () {
					var src = $(this).attr('src');
					if (src && src.startsWith('/')) {
						$(this).attr('src', src.substring(1));
					}
				});
				$(container).find('[style*="url(/"]').each(function () {
					var style = $(this).attr('style');
					if (style) {
						$(this).attr('style', style.replace(/url\(\//g, 'url('));
					}
				});
			}
		}

		var components = [
			{ id: '#preloader-placeholder', file: 'component/inc/preloader.html' },
			{ id: '#search-popup-placeholder', file: 'component/inc/search-popup.html' },
			{ id: '#sidebar-placeholder', file: 'component/inc/sidebar.html' },
			{ id: '#header-placeholder', file: 'component/inc/header.html' },
			{ id: '#mobile-menu-placeholder', file: 'component/inc/mobile-menu.html' },
			{ id: '#main-footer-placeholder', file: 'component/inc/footer.html' }
		];

		var loadedCount = 0;
		var totalToLoad = components.filter(function (c) { return $(c.id).length > 0; }).length;

		components.forEach(function (comp) {
			if ($(comp.id).length) {
				$(comp.id).load(basePath + comp.file, function () {
					fixPaths(comp.id);
					loadedCount++;

					if (comp.id === '#preloader-placeholder') {
						handlePreloader();
					}

					// When both header and mobile menu are loaded, or if all components are loaded
					if (loadedCount === totalToLoad || ($('#header-placeholder .main-header').length && $('#mobile-menu-placeholder .mobile-menu').length)) {
						setupMobileMenu();
						headerStyle(); // Update header style after loading
					}
				});
			}
		});

		// Smooth scroll for anchor links
		$(document).on('click', 'a[href*="#"]', function (event) {
			var href = $(this).attr('href');
			var hash = this.hash;

			// If it's a link to an anchor on the current page
			if (hash && (href.startsWith(hash) || href.indexOf(window.location.pathname + hash) !== -1 || href.indexOf(hash) !== -1)) {
				var target = $(hash);
				if (target.length) {
					event.preventDefault();

					// Close mobile menu if open
					if ($('body').hasClass('mobile-menu-visible')) {
						$('body').removeClass('mobile-menu-visible');
					}

					var headerHeight = $('.main-header').outerHeight() || 70;
					if ($('.sticky-header').is(':visible')) {
						headerHeight = $('.sticky-header').outerHeight() || 70;
					}

					$('html, body').animate({
						scrollTop: target.offset().top - headerHeight
					}, 800, function () {
						// Add hash to URL after animation (optional)
						if (history.pushState) {
							history.pushState(null, null, hash);
						} else {
							window.location.hash = hash;
						}
					});
				}
			}
		});
	});

	// Client button toggle logic
	$(document).ready(function () {
		$('#show-all-clients').on('click', function () {
			$('#partners-row').toggleClass('show-extra');
			$(this).text($('#partners-row').hasClass('show-extra') ? 'See Less' : 'See All');
		});
	});


})(window.jQuery);