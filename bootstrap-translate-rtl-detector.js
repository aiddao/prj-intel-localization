/**
 * Google Translate RTL Detector - Bootstrap Edition
 * Detects language changes and applies Bootstrap-compatible RTL mode
 */

class BootstrapTranslateRTLDetector {
  constructor(options = {}) {
    this.rtlLanguages = new Set([
      'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku',
      'ps', 'ur', 'yi', 'iw' // iw is Hebrew (old code)
    ]);
    
    this.options = {
      loadBootstrapRTL: true,  // Auto-load Bootstrap RTL CSS
      bootstrapVersion: '5',    // Bootstrap version (5 or 4)
      customCallback: null,
      applyToBody: true,
      ...options
    };
    
    this.currentLang = this.detectLanguage();
    this.observer = null;
    this.rtlStylesheet = null;
    this.isBootstrapRTLLoaded = false;
    this.init();
  }

  /**
   * Detect the current language from Google Translate or document
   */
  detectLanguage() {
    // Check Google Translate's lang attribute on html element
    const htmlLang = document.documentElement.lang;
    
    // Check for Google Translate frame
    const translateElement = document.querySelector('.goog-te-banner-frame');
    if (translateElement) {
      const frame = translateElement.contentDocument || translateElement.contentWindow?.document;
      if (frame) {
        const selectElement = frame.querySelector('select.goog-te-combo');
        if (selectElement) {
          return selectElement.value;
        }
      }
    }
    
    // Check for translated elements with lang attribute
    const translatedElement = document.querySelector('[lang]');
    if (translatedElement && translatedElement.lang) {
      return translatedElement.lang;
    }
    
    return htmlLang || 'en';
  }

  /**
   * Check if a language code is RTL
   */
  isRTL(langCode) {
    if (!langCode) return false;
    const baseLang = langCode.toLowerCase().split('-')[0];
    return this.rtlLanguages.has(baseLang);
  }

  /**
   * Load Bootstrap RTL CSS dynamically
   */
  loadBootstrapRTL() {
    if (this.isBootstrapRTLLoaded || !this.options.loadBootstrapRTL) {
      return;
    }

    // Check if Bootstrap RTL is already loaded
    const existingRTL = document.querySelector('link[href*="bootstrap.rtl"]');
    if (existingRTL) {
      this.rtlStylesheet = existingRTL;
      this.isBootstrapRTLLoaded = true;
      return;
    }

    // Find the main Bootstrap CSS link
    const bootstrapLink = document.querySelector('link[href*="bootstrap"]');
    
    if (!bootstrapLink) {
      console.warn('Bootstrap CSS not found. RTL styles may not work correctly.');
      return;
    }

    // Create RTL stylesheet link
    this.rtlStylesheet = document.createElement('link');
    this.rtlStylesheet.rel = 'stylesheet';
    this.rtlStylesheet.id = 'bootstrap-rtl-css';
    
    // Determine Bootstrap RTL URL based on version
    const bootstrapHref = bootstrapLink.href;
    
    if (bootstrapHref.includes('cdn')) {
      // Replace bootstrap.min.css with bootstrap.rtl.min.css
      this.rtlStylesheet.href = bootstrapHref.replace(
        /bootstrap(\.min)?\.css/,
        'bootstrap.rtl$1.css'
      );
    } else {
      // Local file - assume RTL version exists
      this.rtlStylesheet.href = bootstrapHref.replace(
        /bootstrap(\.min)?\.css/,
        'bootstrap.rtl$1.css'
      );
    }

    // Initially disable the RTL stylesheet
    this.rtlStylesheet.disabled = true;
    
    // Insert after Bootstrap CSS
    bootstrapLink.parentNode.insertBefore(this.rtlStylesheet, bootstrapLink.nextSibling);
    
    this.isBootstrapRTLLoaded = true;
    console.log('Bootstrap RTL CSS loaded:', this.rtlStylesheet.href);
  }

  /**
   * Apply Bootstrap-specific RTL adjustments
   */
  applyBootstrapRTL(isRTL) {
    // Toggle Bootstrap RTL stylesheet
    if (this.rtlStylesheet) {
      this.rtlStylesheet.disabled = !isRTL;
    }

    // Update common Bootstrap components
    if (isRTL) {
      // Fix navbar alignment
      document.querySelectorAll('.navbar-nav').forEach(nav => {
        nav.style.marginRight = '0';
        nav.style.marginLeft = 'auto';
      });

      // Fix dropdown menus
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (!menu.classList.contains('dropdown-menu-end')) {
          menu.classList.add('dropdown-menu-end');
        }
      });

      // Fix modal positioning
      document.querySelectorAll('.modal-header .btn-close').forEach(btn => {
        btn.style.marginLeft = '0';
        btn.style.marginRight = 'auto';
      });

      // Fix tooltips and popovers direction
      document.querySelectorAll('[data-bs-toggle="tooltip"], [data-bs-toggle="popover"]').forEach(el => {
        const placement = el.getAttribute('data-bs-placement');
        if (placement === 'left') {
          el.setAttribute('data-bs-placement', 'right');
        } else if (placement === 'right') {
          el.setAttribute('data-bs-placement', 'left');
        }
      });

    } else {
      // Revert to LTR
      document.querySelectorAll('.navbar-nav').forEach(nav => {
        nav.style.marginLeft = '';
        nav.style.marginRight = '';
      });

      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('dropdown-menu-end');
      });

      document.querySelectorAll('.modal-header .btn-close').forEach(btn => {
        btn.style.marginLeft = '';
        btn.style.marginRight = '';
      });

      // Restore original tooltip/popover placements
      document.querySelectorAll('[data-bs-toggle="tooltip"], [data-bs-toggle="popover"]').forEach(el => {
        const originalPlacement = el.getAttribute('data-original-placement');
        if (originalPlacement) {
          el.setAttribute('data-bs-placement', originalPlacement);
        }
      });
    }

    // Reinitialize Bootstrap tooltips and popovers if Bootstrap 5 is loaded
    if (typeof bootstrap !== 'undefined') {
      // Dispose and reinitialize tooltips
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) {
          tooltip.dispose();
        }
        new bootstrap.Tooltip(el);
      });

      // Dispose and reinitialize popovers
      document.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => {
        const popover = bootstrap.Popover.getInstance(el);
        if (popover) {
          popover.dispose();
        }
        new bootstrap.Popover(el);
      });
    }
  }

  /**
   * Apply RTL or LTR direction to the page
   */
  applyDirection(langCode) {
    const isRTL = this.isRTL(langCode);
    const direction = isRTL ? 'rtl' : 'ltr';
    
    console.log(`Language: ${langCode} → Direction: ${direction}`);
    
    // Apply direction to HTML and body
    if (this.options.applyToBody) {
      document.documentElement.setAttribute('dir', direction);
      document.documentElement.setAttribute('lang', langCode);
      document.body.setAttribute('dir', direction);
    }

    // Load Bootstrap RTL CSS if needed
    if (isRTL && this.options.loadBootstrapRTL) {
      this.loadBootstrapRTL();
    }

    // Apply Bootstrap-specific RTL adjustments
    this.applyBootstrapRTL(isRTL);

    // Custom callback
    if (this.options.customCallback) {
      this.options.customCallback({
        language: langCode,
        isRTL: isRTL,
        direction: direction
      });
    }
    
    // Dispatch custom event
    const event = new CustomEvent('translateDirectionChange', {
      detail: {
        language: langCode,
        isRTL: isRTL,
        direction: direction,
        bootstrap: true
      }
    });
    document.dispatchEvent(event);

    // Trigger window resize to help Bootstrap components adjust
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Handle language changes
   */
  handleLanguageChange() {
    const newLang = this.detectLanguage();
    
    if (newLang !== this.currentLang) {
      console.log(`Language changed: ${this.currentLang} → ${newLang}`);
      this.currentLang = newLang;
      this.applyDirection(newLang);
    }
  }

  /**
   * Store original Bootstrap component states
   */
  storeOriginalStates() {
    // Store original tooltip/popover placements
    document.querySelectorAll('[data-bs-toggle="tooltip"], [data-bs-toggle="popover"]').forEach(el => {
      const placement = el.getAttribute('data-bs-placement');
      if (placement && !el.getAttribute('data-original-placement')) {
        el.setAttribute('data-original-placement', placement);
      }
    });
  }

  /**
   * Initialize mutation observer and event listeners
   */
  init() {
    // Store original component states
    this.storeOriginalStates();

    // Apply initial direction
    this.applyDirection(this.currentLang);
    
    // Watch for changes to the html lang attribute
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          this.handleLanguageChange();
        }
        
        // Check if Google Translate elements were added
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.classList?.contains('goog-te-banner-frame') ||
                  node.id === 'google_translate_element' ||
                  node.querySelector?.('.goog-te-banner-frame')) {
                setTimeout(() => this.handleLanguageChange(), 100);
              }
            }
          });
        }
      }
    });
    
    // Observe the entire document
    this.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang', 'class'],
      childList: true,
      subtree: true
    });
    
    // Listen for page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.handleLanguageChange();
        this.storeOriginalStates();
      }, 500);
    });
    
    // Polling fallback
    this.pollInterval = setInterval(() => {
      this.handleLanguageChange();
    }, 1000);

    console.log('Bootstrap RTL Detector initialized');
  }

  /**
   * Clean up and destroy the detector
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Remove RTL stylesheet if it was added
    if (this.rtlStylesheet && this.rtlStylesheet.id === 'bootstrap-rtl-css') {
      this.rtlStylesheet.remove();
    }

    // Reset direction
    document.documentElement.setAttribute('dir', 'ltr');
    document.body.setAttribute('dir', 'ltr');
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.BootstrapTranslateRTLDetector = BootstrapTranslateRTLDetector;
  
  // Auto-start with default options
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.bootstrapTranslateRTLDetectorInstance) {
      window.bootstrapTranslateRTLDetectorInstance = new BootstrapTranslateRTLDetector();
    }
  });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BootstrapTranslateRTLDetector;
}
