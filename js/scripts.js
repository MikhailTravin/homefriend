const AW = {};

AW.modal = new HystModal({
  linkAttributeName: "data-hystmodal",
  closeOnOverlay: false,
  afterClose: (modal) => {
    // switch ($(modal.element).attr('id')) {
    //   case 'modalConfirm': {
    //     $('#modalConfirm [data-confirm-ok]').off('click');
    //     $('#modalConfirm [data-confirm-cancel]').off('click');
    //     break;
    //   }

    //   case 'modalVacancy': {
    //     AW.resetForm($('#modalVacancy form'));
    //     break;
    //   }
    // }
  },
});

AW.FANCYBOX_DEFAULTS = {
  hideScrollbar: false,
  Hash: false,
  Thumbs: {
    type: 'classic',
  },
  Toolbar: {
    display: {
      left: ['infobar'],
      middle: [
        'zoomIn',
        'zoomOut',
      ],
      right: ['close'],
    },
  },
}

$.validator.addMethod('mobileRu', function (phone_number, element) {
  const ruPhone_number = phone_number.replace(/\(|\)|\s+|-/g, "");
  return this.optional(element) || ruPhone_number.length > 9 && /^((\+7|7|8)+([0-9]){10})$/.test(ruPhone_number);
}, "Введите корректный номер телефона");

AW.initMask = function ($field) {
  const type = $field.attr('data-mask');
  let result;
  switch (type) {
    case 'phone':
      result = IMask($field[0], {
        mask: '+{7} (000) 000-00-00',
        lazy: $field.hasClass('field-input1'),
        placeholderChar: '_'
      });
      break;
  }

  return result;
};

AW.validateForm = function ($el) {
  if ($el.length === 0) return;

  const validator = $el.validate({
    ignore: [],
    errorClass: 'form-group__error',
    errorPlacement: function (error, element) {
      const $parent = $(element).closest('.form-group, .form-group1');
      $parent.append(error);
    },
    highlight: function (element) {
      const $parent = $(element).closest('.form-group, .form-group1');
      $parent.addClass('form-group_error');
    },
    unhighlight: function (element) {
      const $parent = $(element).closest('.form-group, .form-group1');
      $parent.removeClass('form-group_error');
    },
    submitHandler: function (form, event) {
      event.preventDefault();
      const trigger = $el.attr('data-onsubmit-trigger');
      if (trigger) {
        $(document).trigger(trigger, { event, form });
      } else {
        form.submit();
      }
    }
  });

  // Добавление правил валидации
  $el.find('.field-input1, .field-input2, .checkbox__input, select').each(function () {
    const $input = $(this);

    if ($input.is(':required')) {
      $input.rules('add', {
        required: true,
        messages: {
          required: 'Поле обязательно для заполнения',
        }
      });
    }

    if ($input.attr('data-type') === 'phone') {
      $input.rules('add', {
        mobileRu: true,
        messages: {
          mobileRu: 'Неккоректный формат данных',
        }
      });
    }

    if ($input.attr('data-type') === 'email') {
      $input.rules('add', {
        email: true,
        messages: {
          email: 'Неккоректный формат данных',
        }
      });
    }
  });

  // Переключение видимости пароля
  $el.on('click', '.form-group1__icon.toggle-password', function (e) {
    e.preventDefault();

    const $icon = $(this);
    const $parent = $icon.closest('.form-group1');
    const $input = $parent.find('input[data-type="password"]');

    if ($input.length > 0) {
      const isPassword = $input.attr('type') === 'password';
      $input.attr('type', isPassword ? 'text' : 'password');

      // Переключаем отображение иконок
      $parent.find('.form-group1__icon').each(function () {
        $(this).toggleClass('hidden');
      });
    }
  });

  return validator;
};

AW.resetForm = function ($form) {
  $form.find('input').each(function () {
    if ($(this).attr('data-mask')) {
      const mask = AW.initMask($(this));
      mask.value = '';
    } else {
      $(this).val('');
    }
  });
  $form.find('.form-group1').removeClass('form-group1_error');
  $form.find('.form-group1__error').remove();
}

$('[data-validate]').each(function () {
  AW.validateForm($(this));
});

AW.StepCounter = class {
  /**
   * Constructor function for creating an instance of the class.
   *
   * @param {jQuery} $element - The jQuery element to bind the functionality to.
   * @param {function} callback - The callback function to be executed on value change.
   * @throws {Error} Throws an error if the element is not found.
   * @return {void}
   */
  constructor($element, callback) {
    if (!$element) throw Error('Element not found!');
    this.element = $element;
    this.callback = callback || null;
    this.btnIncreaseElement = $element.find('[data-stepcounter="+"]');
    this.btnDecreaseElement = $element.find('[data-stepcounter="-"]');
    this.fieldElement = $element.find('[data-stepcounter-input]');
    this.valueElement = $element.find('[data-stepcounter-value]');

    this.maxValue = Number(this.fieldElement.attr('max')) || 10000;
    this.minValue = Number(this.fieldElement.attr('min')) || 0;
    this.step = Number(this.fieldElement.attr('step')) || 1;
    this.value = Number(this.fieldElement.val());

    this.btnIncreaseElement.on('click', this.handleBtnIncrease.bind(this));
    this.btnDecreaseElement.on('click', this.handleBtnDecrease.bind(this));

    this.validateValue(this.value);
  }

  /**
   * Handles the click event of the increase button.
   *
   * @param {Event} event - The click event object.
   * @return {undefined} This function does not return a value.
   */
  handleBtnIncrease(event) {
    event.preventDefault();
    this.updateValue(this.value + this.step);
  }

  /**
   * Handles the click event of the decrease button.
   *
   * @param {Event} event - The click event object.
   * @return {undefined} This function does not return a value.
   */
  handleBtnDecrease(event) {
    event.preventDefault();
    this.updateValue(this.value - this.step);
  }

  /**
   * Updates the value of the object and renders it.
   *
   * @param {number} newValue - The new value to be assigned.
   * @param {boolean} noValidate - Flag indicating whether the value should be validated. Defaults to false.
   */
  updateValue(newValue, noValidate = false) {
    const validatedValue = noValidate ? newValue : this.validateValue(newValue);
    this.value = validatedValue;
    this.renderValue(this.value);
    if (this.callback) {
      this.callback(this.value);
    }
  }

  /**
   * Disables a button based on the given parameter.
   *
   * @param {string} btn - The button to enable. It can be either 'increase' or 'decrease'.
   */
  disableBtn(btn) {
    if (btn === 'increase') {
      this.btnIncreaseElement.attr('disabled', true);
    }
    if (btn === 'decrease') {
      this.btnDecreaseElement.attr('disabled', true);
    }
  }

  /**
   * Enables a button based on the given parameter.
   *
   * @param {string} btn - The button to enable. It can be either 'increase' or 'decrease'.
   */
  enableBtn(btn) {
    if (btn === 'increase') {
      this.btnIncreaseElement.attr('disabled', false);
    }
    if (btn === 'decrease') {
      this.btnDecreaseElement.attr('disabled', false);
    }
  }

  /**
   * Validates the given value based on the minimum and maximum values.
   *
   * @param {number} value - The value to be validated.
   * @return {number} The validated value within the specified range.
   */
  validateValue(value) {
    let validatedValue;
    if (value >= this.maxValue) {
      validatedValue = this.maxValue;
      this.disableBtn('increase');
    } else if (value <= this.minValue) {
      validatedValue = this.minValue;
      this.disableBtn('decrease');
    } else {
      validatedValue = value;
      this.enableBtn('increase');
      this.enableBtn('decrease');
    }
    return validatedValue;
  }

  /**
   * Renders the value by updating the field element's value
   * and the value element's text.
   *
   * @param {Number} value - The value to be rendered.
   */
  renderValue(value) {
    this.fieldElement.val(value);
    this.valueElement.text(value);
  }

  /**
   * Retrieves the current value.
   *
   * @return {number} The current value.
   */
  getCurrentValue() {
    return this.value;
  }

  /**
   * This function destroys the event listeners for the button elements.
   */
  destroy() {
    this.btnIncreaseElement.off('click', this.handleBtnIncrease.bind(this));
    this.btnDecreaseElement.off('click', this.handleBtnDecrease.bind(this));
  }
};

$(document).ready(() => {
  Fancybox.defaults.Hash = false;
  Fancybox.defaults.l10n = {
    CLOSE: 'Закрыть',
    NEXT: 'Следующий',
    PREV: 'Предыдущий',
    MODAL: 'Вы можете закрыть это окно нажав на клавишу ESC',
    ERROR: 'Что-то пошло не так, пожалуйста, попробуйте еще раз',
    IMAGE_ERROR: 'Изображение не найдено',
    ELEMENT_NOT_FOUND: 'HTML элемент не найден',
    AJAX_NOT_FOUND: 'Ошибка загрузки AJAX : Не найдено',
    AJAX_FORBIDDEN: 'Ошибка загрузки AJAX : Нет доступа',
    IFRAME_ERROR: 'Ошибка загрузки страницы',
    ZOOMIN: 'Увеличить',
    ZOOMOUT: 'Уменьшить',
    TOGGLE_THUMBS: 'Галерея',
    TOGGLE_SLIDESHOW: 'Слайдшоу',
    TOGGLE_FULLSCREEN: 'На весь экран',
    DOWNLOAD: 'Скачать'
  };

  Fancybox.bind('[data-fancybox]', AW.FANCYBOX_DEFAULTS);

  // Этот хак помогает избежать прыжков анимации при загрузке страницы
  $('body').removeClass('preload');

  $('[data-mask]').each(function () {
    AW.initMask($(this));
  });

  $('[data-stepcounter]').each(function () {
    new AW.StepCounter($(this));
  });

  $('[data-select1]').each(function () {
    new TomSelect($(this)[0], {
      controlInput: null,
      create: true,
      render: {
        item: function (data, escape) {
          return `
            <div class="item">
              ${escape(data.text)}
            </div>
          `;
        },
      },
      onInitialize: function () {
        $(this.control).append(`
          <svg aria-hidden="true" width="10" height="6">
            <use xlink:href="img/sprite.svg#chevron2"></use>
          </svg>
        `);
      }
    });
  });

  $('[data-expandable-handle]').click(function () {
    const $parent = $(this).closest('[data-expandable]');
    const $accordion = $(this).closest('[data-container="accordion"]');
    if ($parent.attr('data-expandable') === 'collapsed') {
      $accordion.find('[data-expandable="expanded"] [data-expandable-clip]').css('overflow', 'hidden');
      $accordion.find('[data-expandable="expanded"]').attr('data-expandable', 'collapsed');
      $parent.attr('data-expandable', 'expanded');
      setTimeout(() => {
        // Небольшой костыль для ровной работы экспандера
        $parent.find('[data-expandable-clip]').css('overflow', 'visible');
      }, 250);
    } else {
      $parent.find('[data-expandable-clip]').css('overflow', 'hidden');
      $parent.attr('data-expandable', 'collapsed');
    }
  });



  $('body').on('click', function (event) {
    if (
      $('.dd-header-catalog').hasClass('dd-header-catalog_active')
      &&
      $(event.target).attr('data-action') !== 'showHeaderCatalog'
      &&
      $(event.target).closest('[data-action="showHeaderCatalog"]').length === 0
      &&
      $(event.target).closest('.dd-header-catalog').length === 0
      &&
      !$(event.target).hasClass('dd-header-catalog')
    ) {
      hideHeaderCatalog();
    }
  });

  $('body').on('click', '[data-action]', function (event) {
    const alias = $(this).attr('data-action');

    switch (alias) {
      case 'testAction': {

        break;
      }
    }
  });

  $('body').on('input', '[data-action-input]', function (event) {
    const alias = $(this).attr('data-action-input');

    switch (alias) {
      case 'testAction': {

        break;
      }
    }
  });

  // Находим все блоки с табами
  const tabBlocks = document.querySelectorAll('.block-tabs');

  if (tabBlocks) {
    tabBlocks.forEach(block => {
      const tabButtons = block.querySelectorAll('[data-id]');
      const tabContents = block.querySelectorAll('.tabs__body');

      if (tabButtons.length && tabContents.length) {
        tabButtons.forEach(button => {
          button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');

            // Сбрасываем активные классы только внутри текущего блока
            tabContents.forEach(content => {
              content.classList.remove('_tab-active');
            });

            tabButtons.forEach(btn => {
              btn.classList.remove('_tab-active');
            });

            // Активируем нужный таб и кнопку в текущем блоке
            const activeTab = block.querySelector(`.tabs__body[data-id="${id}"]`);
            if (activeTab) {
              activeTab.classList.add('_tab-active');
            }

            this.classList.add('_tab-active');
          });
        });
      }
    });
  }

  //Поиск
  const button = document.querySelector('.header-search__button');
  const headerSearch = document.querySelector('.header-search');

  if (button && headerSearch) {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      headerSearch.classList.toggle('_active');
      document.documentElement.classList.toggle('search-open');
    });

    // Закрытие при клике вне блока
    document.addEventListener('click', function (e) {
      if (!headerSearch.contains(e.target)) {
        headerSearch.classList.remove('_active');
        document.documentElement.classList.remove('search-open');
      }
    });
  }

  //Меню
  const iconMenu = document.querySelector('.icon-menu');
  if (iconMenu) {
    iconMenu.addEventListener("click", function (e) {
      document.documentElement.classList.toggle("menu-open");
    });
  }

  //подменю
  const menuButtons = document.querySelectorAll('.menu__button');
  if (menuButtons) {
    menuButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.stopPropagation();

        const submenu = this.nextElementSibling;

        // Сначала убираем _active1 у всех подменю
        document.querySelectorAll('.submenu1._active1').forEach(item => {
          item.classList.remove('_active1');
        });

        // Затем добавляем только у нужного
        if (submenu && submenu.classList.contains('submenu1')) {
          submenu.classList.add('_active1');
        }
      });
    });

    // Закрытие подменю при клике вне его
    document.addEventListener('click', function (e) {
      document.querySelectorAll('.submenu1._active1').forEach(submenu => {
        if (!submenu.contains(e.target) && !e.target.closest('.menu__button')) {
          submenu.classList.remove('_active1');
        }
      });
    });
  };

  const subMenuButtons = document.querySelectorAll('.menu__button2');
  if (subMenuButtons) {
    subMenuButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.stopPropagation();

        // Ищем .menu__submenu2 внутри одного родителя
        const submenu = this.parentElement.querySelector('.menu__submenu2');

        // Сначала убираем _active2 у всех подменю второго уровня
        document.querySelectorAll('.menu__submenu2._active2').forEach(item => {
          item.classList.remove('_active2');
        });

        // Добавляем _active2 только текущему подменю
        if (submenu) {
          submenu.classList.add('_active2');
        }
      });
    });

    // Закрытие подменю при клике вне его
    document.addEventListener('click', function (e) {
      document.querySelectorAll('.menu__submenu2._active2').forEach(submenu => {
        if (!submenu.contains(e.target) && !e.target.closest('.menu__button2')) {
          submenu.classList.remove('_active2');
        }
      });
    });
  }

  const backButtons = document.querySelectorAll('.menu__back');
  if (backButtons) {
    backButtons.forEach(button => {
      button.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Находим ближайшее .menu__submenu2 и убираем у него _active2
        const submenu = this.closest('.menu__submenu2');
        if (submenu && submenu.classList.contains('_active2')) {
          submenu.classList.remove('_active2');
        }
      });
    });
  }

  //характеристики
  const characteristics = document.querySelectorAll('.characteristics-products');
  if (characteristics.length > 0) {
    // Для каждого элемента характеристик
    characteristics.forEach(char => {
      const button = char.querySelector('.characteristics-products__button');

      // Обработчик клика на кнопку
      button.addEventListener('click', function (e) {
        // Сначала убираем _active у всех
        characteristics.forEach(other => {
          if (other !== char) {
            other.classList.remove('_active');
          }
        });

        // Переключаем _active у текущего элемента
        char.classList.toggle('_active');
      });
    });
  }

  AW.initSliderIntro = function ($el) {
    const $wrapper = $('[data-swiper-wrapper="intro"]');
    const $navNext = $wrapper.find('.swiper-nav_next');
    const $navPrev = $wrapper.find('.swiper-nav_prev');
    const $pagination = $wrapper.find('.swiper-pagination');
    const $slides = $el.find('.swiper-slide');
    return new Swiper($el[0], {
      loop: true,
      spaceBetween: 0,
      slidesPerView: 1,
      speed: 200,
      navigation: {
        nextEl: $navNext[0],
        prevEl: $navPrev[0],
      },
      pagination: {
        el: $pagination[0],
      },
    });
  }
  $('[data-swiper="intro"]').each(function () {
    AW.initSliderIntro($(this));
  });

  AW.initSliderCatalog = function ($el) {
    const $wrapper = $('[data-swiper-wrapper="catalog"]');
    const $navNext = $wrapper.find('.swiper-nav_next');
    const $navPrev = $wrapper.find('.swiper-nav_prev');
    const $pagination = $wrapper.find('.swiper-pagination');
    const $slides = $el.find('.swiper-slide');
    return new Swiper($el[0], {
      spaceBetween: 6,
      slidesPerView: 20,
      speed: 200,
      navigation: {
        nextEl: $navNext[0],
        prevEl: $navPrev[0],
      },
      pagination: {
        el: $pagination[0],
      },
      breakpoints: {
        0: {
          slidesPerView: 2.5,
          spaceBetween: 10,
        },
        550: {
          slidesPerView: 3.5,
          spaceBetween: 10,
        },
        992: {
          slidesPerView: 5,
          spaceBetween: 20,
        },
        1200: {
          slidesPerView: 6,
          spaceBetween: 20,
        }
      }
    });
  }
  $('[data-swiper="catalog"]').each(function () {
    AW.initSliderCatalog($(this));
  });

  AW.initSliderBrands = function ($el) {
    const $wrapper = $('[data-swiper-wrapper="brands"]');
    const $navNext = $wrapper.find('.swiper-nav_next');
    const $navPrev = $wrapper.find('.swiper-nav_prev');
    const $pagination = $wrapper.find('.swiper-pagination');
    const $slides = $el.find('.swiper-slide');
    return new Swiper($el[0], {
      spaceBetween: 6,
      slidesPerView: 20,
      speed: 200,
      navigation: {
        nextEl: $navNext[0],
        prevEl: $navPrev[0],
      },
      pagination: {
        el: $pagination[0],
      },
      breakpoints: {
        0: {
          slidesPerView: 2.5,
          spaceBetween: 10,
        },
        550: {
          slidesPerView: 3.5,
          spaceBetween: 10,
        },
        992: {
          slidesPerView: 5,
          spaceBetween: 20,
        },
        1200: {
          slidesPerView: 6,
          spaceBetween: 20,
        }
      }
    });
  }
  $('[data-swiper="brands"]').each(function () {
    AW.initSliderBrands($(this));
  });

  // Хранилище для слайдеров (по wrapper и ID таба)
  const slidersMap = {};

  function initTabSliders(wrapperSelector, sliderSelector, slidersStorage) {
    const $wrappers = $(wrapperSelector);

    $wrappers.each(function () {
      const $wrapper = $(this);
      const $navNext = $wrapper.find('.swiper-nav_next')[0];
      const $navPrev = $wrapper.find('.swiper-nav_prev')[0];

      // Инициализируем все слайдеры внутри текущего wrapper
      $wrapper.find(sliderSelector).each(function () {
        const $el = $(this);
        const tabId = $el.closest('.tabs__body').attr('data-id');

        const slider = new Swiper($el[0], {
          spaceBetween: 5,
          slidesPerView: 20,
          speed: 200,
          navigation: {
            nextEl: $navNext,
            prevEl: $navPrev,
          },
          pagination: {
            el: $wrapper.find('.swiper-pagination')[0],
          },
          breakpoints: {
            0: { slidesPerView: 1.5, spaceBetween: 10 },
            375: { slidesPerView: 2.1, spaceBetween: 10 },
            768: { slidesPerView: 2.5, spaceBetween: 10 },
            1200: { slidesPerView: 3.2, spaceBetween: 20 },
            1400: { slidesPerView: 5, spaceBetween: 20 }
          },
          on: {
            init: function () {
              updateNavigationButtons(this);
            },
            slideChange: function () {
              updateNavigationButtons(this);
            }
          }
        });

        // Сохраняем слайдер в объекте по ID вкладки и ID блока
        const wrapperId = $wrapper.attr('data-swiper-wrapper');
        if (!slidersStorage[wrapperId]) {
          slidersStorage[wrapperId] = {};
        }

        slidersStorage[wrapperId][tabId] = slider;
      });
    });

    // После инициализации всех слайдеров — обновляем только активные табы
    setTimeout(() => {
      $('.heading-complex__nav button._tab-active').each(function () {
        const $button = $(this);
        const tabId = $button.attr('data-id');
        const $wrapper = $button.closest('[data-swiper-wrapper]');
        const wrapperId = $wrapper.attr('data-swiper-wrapper');

        const slider = slidersStorage[wrapperId]?.[tabId];
        if (slider) {
          requestAnimationFrame(() => {
            slider.update();
            updateNavigationButtons(slider);
          });
        }
      });
    }, 100);
  }

  function updateNavigationButtons(slider) {
    const isBeginning = slider.isBeginning;
    const isEnd = slider.isEnd;

    if (slider.params.navigation && slider.params.navigation.nextEl) {
      const nextEl = slider.navigation.nextEl;
      if (isEnd) {
        nextEl.classList.add('swiper-button-disabled');
      } else {
        nextEl.classList.remove('swiper-button-disabled');
      }
    }

    if (slider.params.navigation && slider.params.navigation.prevEl) {
      const prevEl = slider.navigation.prevEl;
      if (isBeginning) {
        prevEl.classList.add('swiper-button-disabled');
      } else {
        prevEl.classList.remove('swiper-button-disabled');
      }
    }
  }

  // Инициализируем слайдеры для разных типов
  initTabSliders('[data-swiper-wrapper="news"]', '[data-swiper="news"]', slidersMap);
  initTabSliders('[data-swiper-wrapper="recommended"]', '[data-swiper="recommended"]', slidersMap);

  // Переключение табов и обновление слайдера
  $('.heading-complex__nav button').on('click', function () {
    const $button = $(this);
    const tabId = $button.attr('data-id');
    const $wrapper = $button.closest('[data-swiper-wrapper]');
    const wrapperId = $wrapper.attr('data-swiper-wrapper');

    // Удаляем класс _tab-active у всех кнопок и tabs__body
    $wrapper.find('.heading-complex__nav button').removeClass('_tab-active');
    $wrapper.find('.tabs__body').removeClass('_tab-active');

    // Добавляем к текущей
    $button.addClass('_tab-active');
    $wrapper.find(`.tabs__body[data-id="${tabId}"]`).addClass('_tab-active');

    // Получаем слайдер по ID вкладки и обновляем его
    const slider = slidersMap[wrapperId]?.[tabId];
    if (slider) {
      requestAnimationFrame(() => {
        slider.update(); // <-- Обновляем размеры слайдера
        updateNavigationButtons(slider); // <-- Принудительно обновляем состояние кнопок
      });
    }
  });

});