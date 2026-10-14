(function($) {
	
	"use strict";

	function loadWowoniComponents() {
		var scriptUrl = document.currentScript && document.currentScript.src
			? new URL(document.currentScript.src)
			: new URL("assets/js/script.js", window.location.href);
		var siteRoot = new URL("../../", scriptUrl);
		var slots = Array.prototype.slice.call(document.querySelectorAll("[data-wowoni-include]"));

		if (!slots.length) {
			return Promise.resolve();
		}

		var mainCss = Array.prototype.find.call(document.querySelectorAll("link[rel='stylesheet'][href]"), function(link) {
			return new URL(link.href, document.baseURI).pathname.endsWith("/assets/css/main.css");
		});
		var sharedCss = document.querySelector("link[data-wowoni-shared-css]") || mainCss;
		if (!sharedCss) {
			sharedCss = document.createElement("link");
			sharedCss.rel = "stylesheet";
			sharedCss.href = new URL("assets/css/main.css", siteRoot).href;
			sharedCss.setAttribute("data-wowoni-shared-css", "");
			document.head.appendChild(sharedCss);
		}

		var cssReady = new Promise(function(resolve) {
			if (sharedCss.sheet) {
				resolve();
			} else {
				sharedCss.addEventListener("load", resolve, { once: true });
				sharedCss.addEventListener("error", resolve, { once: true });
			}
		});

		var routes = {
			home: "index.html",
			services: "services/service.html",
			about: "about/about.html",
			career: "career/career.html",
			"open-positions": "career/open-positions.html",
			contact: "contact/contact.html",
			"core-banking-transformation": "services/core-banking-transformation.html",
			"digital-transformation": "services/digital-transformation.html",
			"application-development": "services/application-development.html",
			"application-infrastructure-management": "services/application-and-infrastructure-management.html",
			"elite-it-resources": "services/elite-it-resources.html",
			"testing-services": "services/testing-services.html"
		};
		var pageName = window.location.pathname.split("/").filter(Boolean).pop() || "";
		var currentSubRoute = pageName === "digital-transformation.html" ? "digital-transformation"
			: pageName === "elite-it-resources.html" ? "elite-it-resources"
			: pageName === "testing-services.html" ? "testing-services"
			: pageName === "open-positions.html" ? "open-positions"
			: pageName === "core-banking-transformation.html" ? "core-banking-transformation"
			: pageName === "application-development.html" ? "application-development"
			: pageName === "application-and-infrastructure-management.html" ? "application-infrastructure-management" : "";
		var currentRoute = currentSubRoute && currentSubRoute !== "open-positions" ? "services"
			: pageName.indexOf("contact") === 0 ? "contact"
			: pageName === "career.html" || pageName === "open-positions.html" ? "career"
			: pageName.indexOf("about") === 0 ? "about"
			: pageName.indexOf("service") === 0 || pageName === "services" ? "services"
			: pageName.indexOf("index") === 0 || pageName === "" ? "home" : "";
		document.body.classList.toggle("home-page", currentRoute === "home");

		function prepareFragment(fragment) {
			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-route]"), function(link) {
				var route = link.getAttribute("data-wowoni-route");
				if (routes[route]) {
					link.href = new URL(routes[route], siteRoot).href;
				}
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-asset]"), function(asset) {
				asset.src = new URL(asset.getAttribute("data-wowoni-asset"), siteRoot).href;
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-bg]"), function(element) {
				element.style.backgroundImage = "url(\"" + new URL(element.getAttribute("data-wowoni-bg"), siteRoot).href + "\")";
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-nav]"), function(item) {
				if (item.getAttribute("data-wowoni-nav") === currentRoute) {
					item.classList.add("current");
				}
			});

			Array.prototype.forEach.call(fragment.querySelectorAll("[data-wowoni-subnav]"), function(item) {
				if (item.getAttribute("data-wowoni-subnav") === currentSubRoute) {
					item.classList.add("current");
					var currentLink = item.querySelector("a");
					if (currentLink) {
						currentLink.setAttribute("aria-current", "page");
					}
				}
			});
		}

		var componentsReady = Promise.all(slots.map(function(slot) {
			var component = slot.getAttribute("data-wowoni-include");
			return fetch(new URL("component/" + component + ".html", siteRoot).href)
				.then(function(response) {
					if (!response.ok) {
						return fetch(new URL("inc/" + component + ".html", siteRoot).href);
					}
					return response;
				})
				.then(function(response) {
					if (!response.ok) {
						throw new Error("Unable to load shared component: " + component);
					}
					return response.text();
				})
				.then(function(markup) {
					var template = document.createElement("template");
					template.innerHTML = markup;
					prepareFragment(template.content);
					if (component === "header") {
						slot.classList.add("shared-header-slot");
						if (currentRoute === "home") {
							slot.classList.add("home-header-slot");
						}
					}
					slot.replaceChildren(template.content);
				});
		}));

		return Promise.all([componentsReady, cssReady]).then(function() {
			var mainMenu = document.querySelector(".shared-header .main-menu");
			if (mainMenu) {
				var menuMarkup = mainMenu.innerHTML;
				var mobileMenu = document.querySelector(".mobile-menu .menu-outer");
				var stickyMenu = document.querySelector(".shared-header .sticky-header .main-menu");
				if (mobileMenu) {
					mobileMenu.innerHTML = menuMarkup;
				}
				if (stickyMenu) {
					stickyMenu.innerHTML = menuMarkup;
				}
			}

			$(document).off("click.wowoniShared", ".mobile-nav-toggler")
				.on("click.wowoniShared", ".mobile-nav-toggler", function() {
					$("body").addClass("mobile-menu-visible");
				})
				.off("keydown.wowoniShared", ".mobile-nav-toggler")
				.on("keydown.wowoniShared", ".mobile-nav-toggler", function(event) {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						$(this).trigger("click");
					}
				});

			$(document).off("click.wowoniShared", ".mobile-menu .menu-backdrop, .mobile-menu .close-btn")
				.on("click.wowoniShared", ".mobile-menu .menu-backdrop, .mobile-menu .close-btn", function() {
					$("body").removeClass("mobile-menu-visible");
				});

			$(document).off("click.wowoniShared", ".mobile-menu .dropdown-btn")
				.on("click.wowoniShared", ".mobile-menu .dropdown-btn", function() {
					var isOpen = !$(this).hasClass("open");
					$(this).toggleClass("open", isOpen).attr("aria-expanded", String(isOpen)).prev("ul").slideToggle(350);
					$(this).prev(".megamenu").slideToggle(900);
				});

			$(document).off("click.wowoniShared", ".main-header .main-menu li.dropdown > .dropdown-btn")
				.on("click.wowoniShared", ".main-header .main-menu li.dropdown > .dropdown-btn", function() {
					var button = $(this);
					var item = button.parent();
					var isOpen = !item.hasClass("is-open");
					$(".main-header .main-menu li.dropdown").not(item).removeClass("is-open").children(".dropdown-btn").removeClass("open").attr("aria-expanded", "false");
					item.toggleClass("is-open", isOpen);
					button.toggleClass("open", isOpen).attr("aria-expanded", String(isOpen));
				});

			headerStyle();
		}).catch(function(error) {
			console.error(error);
		});
	}

	loadWowoniComponents();
	
	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if($('.loader-wrap').length){
			$('.loader-wrap').delay(1000).fadeOut(500);
		}
	}

	if ($(".preloader-close").length) {
        $(".preloader-close").on("click", function(){
            $('.loader-wrap').delay(200).fadeOut(500);
        })
    }
	
	//Update Header Style and Scroll to Top
	function headerStyle() {
		if($('.main-header').length){
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


	//Submenu Dropdown Toggle
	if($('.main-header li.dropdown ul').length){
		$('.main-header .navigation li.dropdown').append('<div class="dropdown-btn"><span class="fas fa-angle-down"></span></div>');
		
	}

	//Mobile Nav Hide Show
	if($('.mobile-menu').length){
		
		$('.mobile-menu .menu-box');
		
		var mobileMenuContent = $('.main-header .menu-area .main-menu').html();
		$('.mobile-menu .menu-box .menu-outer').append(mobileMenuContent);
		$('.sticky-header .main-menu').append(mobileMenuContent);
		
		//Dropdown Button
		$('.mobile-menu li.dropdown .dropdown-btn').on('click', function() {
			$(this).toggleClass('open');
			$(this).prev('ul').slideToggle(500);
		});
		//Dropdown Button
		$('.mobile-menu li.dropdown .dropdown-btn').on('click', function() {
			$(this).prev('.megamenu').slideToggle(900);
		});
		//Menu Toggle Btn
		$('.mobile-nav-toggler').on('click', function() {
			$('body').addClass('mobile-menu-visible');
		});

		//Menu Toggle Btn
		$('.mobile-menu .menu-backdrop,.mobile-menu .close-btn').on('click', function() {
			$('body').removeClass('mobile-menu-visible');
		});
	}


	// Scroll to a Specific Div
	if($('.scroll-to-target').length){
		$(".scroll-to-target").on('click', function() {
			var target = $(this).attr('data-target');
		   // animate
		   $('html, body').animate({
			   scrollTop: $(target).offset().top
			 }, 1000);
	
		});
	}

	// Elements Animation
	if ($('.service-card-reveal').length) {
		var wowoniServiceCardAnimation = new WOW({
			boxClass: 'service-card-reveal',
			mobile: true,
			live: false
		});
		wowoniServiceCardAnimation.init();
	}

	if($('.wow').length){
		var wow = new WOW({
		mobile:       false
		});
		wow.init();
	}

	//Contact Form Validation
	if($('#contact-form').length){
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
	if($('.count-box').length){
		$('.count-box').appear(function(){
	
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
					step: function() {
						$t.find(".count-text").text(Math.floor(this.countNum));
					},
					complete: function() {
						$t.find(".count-text").text(this.countNum);
					}
				});
			}
			
		},{accY: 0});
	}


	// Progress Bar
	if ($('.count-bar').length) {
		$('.count-bar').appear(function(){
			var el = $(this);
			var percent = el.data('percent');
			$(el).css('width',percent).addClass('counted');
		},{accY: -50});

	}


	//LightBox / Fancybox
	if($('.lightbox-image').length) {
		$('.lightbox-image').fancybox({
			openEffect  : 'fade',
			closeEffect : 'fade',
			helpers : {
				media : {}
			}
		});
	}


	//Tabs Box
	if($('.tabs-box').length){
		$('.tabs-box .tab-buttons .tab-btn').on('click', function(e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));
			
			if ($(target).is(':visible')){
				return false;
			}else{
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
	if($('.accordion-box').length){
		$(".accordion-box").on('click', '.acc-btn', function() {
			
			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');
			
			if($(this).hasClass('active')!==true){
				$(outerBox).find('.accordion .acc-btn').removeClass('active');
			}
			
			if ($(this).next('.acc-content').is(':visible')){
				return false;
			}else{
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
            loop:true,
			margin:0,
			nav:true,
			animateOut: 'fadeOut',
    		animateIn: 'fadeIn',
    		active: true,
			smartSpeed: 1000,
			autoplay: 6000,
            navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
            responsive:{
                0:{
                    items:1
                },
                600:{
                    items:1
                },
                800:{
                    items:1
                },
                1024:{
                    items:1
                }
            }
        });
    }


    // single-item-carousel
	if ($('.single-item-carousel').length) {
		$('.single-item-carousel').owlCarousel({
			loop:true,
			margin:30,
			nav:true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				480:{
					items:1
				},
				600:{
					items:1
				},
				800:{
					items:1
				},			
				1200:{
					items:1
				}

			}
		});    		
	}


	// two-item-carousel
	if ($('.two-item-carousel').length) {
		$('.two-item-carousel').owlCarousel({
			loop:true,
			margin:30,
			nav:true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				480:{
					items:1
				},
				600:{
					items:1
				},
				800:{
					items:2
				},			
				1200:{
					items:2
				}

			}
		});    		
	}


    // three-item-carousel
	if ($('.three-item-carousel').length) {
		$('.three-item-carousel').owlCarousel({
			loop:true,
			margin:30,
			nav:true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				480:{
					items:1
				},
				600:{
					items:2
				},
				800:{
					items:2
				},			
				1200:{
					items:3
				}

			}
		});    		
	}


	// four-item-carousel
	if ($('.four-item-carousel').length) {
		$('.four-item-carousel').owlCarousel({
			loop:true,
			margin:30,
			nav:true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				480:{
					items:1
				},
				600:{
					items:2
				},
				800:{
					items:3
				},			
				1200:{
					items:4
				}

			}
		});    		
	}


	// project-carousel
	if ($('.project-carousel').length) {
		$('.project-carousel').owlCarousel({
			loop:true,
			margin:0,
			nav:true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				480:{
					items:1
				},
				600:{
					items:2
				},
				800:{
					items:3
				},			
				1200:{
					items:4
				}

			}
		});    		
	}


	// five-item-carousel
	if ($('.five-item-carousel').length) {
		$('.five-item-carousel').owlCarousel({
			loop:true,
			margin:30,
			nav:true,
			smartSpeed: 500,
			autoplay: 1000,
			navText: [ '<span class="fal fa-angle-left"></span>', '<span class="fal fa-angle-right"></span>' ],
			responsive:{
				0:{
					items:1
				},
				480:{
					items:2
				},
				600:{
					items:3
				},
				800:{
					items:4
				},			
				1200:{
					items:5
				}

			}
		});    		
	}



	//Add One Page nav
	if($('.scroll-nav').length) {
		$('.scroll-nav').onePageNav();
	}


	// page direction
	function directionswitch() {
	  	if ($('.page_direction').length) {

	    	$('.direction_switch button').on('click', function() {
			   $('body').toggleClass(function(){
			      return $(this).is('.rtl, .ltr') ? 'rtl ltr' : 'rtl';
			  })
			});
	  	};
	}


	//nice select
	$(document).ready(function() {
      $('select:not(.ignore)').niceSelect();
    });

    //ScrollAnimations
	var $containers = $('[data-animation]:not([data-animation-text]), [data-animation-box]');
	$containers.scrollAnimations();


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
	if($('#search-popup').length){
		
		//Show Popup
		$('.search-toggler').on('click', function() {
			$('#search-popup').addClass('popup-visible');
		});
		$(document).keydown(function(e){
	        if(e.keyCode === 27) {
	            $('#search-popup').removeClass('popup-visible');
	        }
	    });
		//Hide Popup
		$('.close-search,.search-popup .overlay-layer').on('click', function() {
			$('#search-popup').removeClass('popup-visible');
		});
	}


	// Scroll top button
    $('.scroll-top-inner').on("click", function () {
        $('html, body').animate({scrollTop: 0}, 500);
        return false;
    });


    function handleScrollbar() {
        const bHeight = $('body').height();
        const scrolled = $(window).innerHeight() + $(window).scrollTop();

        let percentage = ((scrolled / bHeight) * 100);

        if (percentage > 100) percentage = 100;

        $('.scroll-top-inner .bar-inner').css( 'width', percentage + '%');
    }


    //Sortable Masonary with Filters
	function enableMasonry() {
		if($('.sortable-masonry').length){
	
			var winDow = $(window);
			// Needed variables
			var $container=$('.sortable-masonry .items-container');
			var $filter=$('.filter-btns');
	
			$container.isotope({
				filter:'*',
				 masonry: {
					columnWidth : '.masonry-item.small-column'
				 },
				animationOptions:{
					duration:500,
					easing:'linear'
				}
			});
			
	
			// Isotope Filter 
			$filter.find('li').on('click', function(){
				var selector = $(this).attr('data-filter');
	
				try {
					$container.isotope({ 
						filter	: selector,
						animationOptions: {
							duration: 500,
							easing	: 'linear',
							queue	: false
						}
					});
				} catch(err) {
	
				}
				return false;
			});
	
	
			winDow.on('resize', function(){
				var selector = $filter.find('li.active').attr('data-filter');

				$container.isotope({ 
					filter	: selector,
					animationOptions: {
						duration: 500,
						easing	: 'linear',
						queue	: false
					}
				});
			});
	
	
			var filterItemA	= $('.filter-btns li');
	
			filterItemA.on('click', function(){
				var $this = $(this);
				if ( !$this.hasClass('active')) {
					filterItemA.removeClass('active');
					$this.addClass('active');
				}
			});
		}
	}
	
	enableMasonry();


	if($('.timer').length){
	   $(function(){
		    $('[data-countdown]').each(function() {
		   var $this = $(this), finalDate = $(this).data('countdown');
		   $this.countdown(finalDate, function(event) {
		     $this.html(event.strftime('%D days %H:%M:%S'));
		   });
		 });
		});

	   $('.cs-countdown').countdown('').on('update.countdown', function(event) {
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
	
	$(window).on('scroll', function() {
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
	
	$(window).on('load', function() {
		handlePreloader();
	});

	

})(window.jQuery);