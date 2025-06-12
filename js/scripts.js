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

  // Добавляем обработку перехода по якорным ссылкам
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const hash = this.getAttribute('href');

      // Проверяем, совпадает ли хэш с id какой-либо вкладки
      if (hash === '#characteristics') {

        const tabBlock = document.querySelector('.block-tabs');

        if (tabBlock) {
          // Находим кнопку с нужным id
          const characteristicsButton = tabBlock.querySelector('button#characteristics');

          if (characteristicsButton) {
            // Эмулируем клик по кнопке вкладки
            characteristicsButton.click();
          }
        }
      }
    });
  });

  //Плавающая кнопка
  const filterFloatingButton = document.querySelector(".filter-catalog-detail__floating-btn");

  if (filterFloatingButton) {
    let header = document.querySelector(".header");
    const filterContent = document.querySelector(".filter-catalog-detail__content");

    // Получаем все .filter-catalog-detail__item, кроме первого
    const filterItems = document.querySelectorAll(".filter-catalog-detail__item");
    const activeFilterItems = Array.from(filterItems).slice(1); // пропускаем первый

    // Собираем все нужные инпуты (чекбоксы и радио)
    const allInputs = activeFilterItems.flatMap(item => {
      const checkboxes = item.querySelectorAll(".checkbox__input");
      const radios = item.querySelectorAll(".radio__input");
      return [...checkboxes, ...radios];
    });

    // Расчёт позиции кнопки
    let wfilterContent = window.getComputedStyle(filterContent, false).width;
    wfilterContent = Number(wfilterContent.slice(0, wfilterContent.length - 2));
    let hfilterContent = filterContent.getBoundingClientRect().top;

    filterFloatingButton.style.left = wfilterContent + "px";
    filterFloatingButton.style.display = "none";

    let timeoutId = null;

    let hheader = window.getComputedStyle(header, false).height;
    hheader = Number(hheader.slice(0, hheader.length - 2));

    function handleInputToggle(input) {
      if (document.documentElement.clientWidth > 992) {
        if (timeoutId) clearTimeout(timeoutId);

        let top = input.getBoundingClientRect().top - hfilterContent + 15;
        filterFloatingButton.style.top = top + "px";

        if (input.checked) {
          filterFloatingButton.style.display = "block";
        } else {
          filterFloatingButton.style.display = "none";
        }

        timeoutId = setTimeout(() => {
          filterFloatingButton.style.display = "none";
        }, 10000);
      }
    }

    allInputs.forEach(input => {
      input.addEventListener("change", () => {
        handleInputToggle(input);
      });
    });
  }

  //Поиск
  const button = document.querySelector('.search__button');
  const headerSearch = document.querySelector('.search');

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

  //Фильтр
  const filterMob = document.querySelector('.block-catalog-detail__filter-mob');
  const filterPanel = document.querySelector('.filter-catalog-detail');
  const filterCloseBtn = document.querySelector('.filter-catalog-detail__close');
  if (filterMob) {

    // Открытие фильтра
    filterMob.addEventListener('click', function (e) {
      e.stopPropagation();
      document.documentElement.classList.add('filter-open');
      filterPanel.classList.add('filter-open');
    });

    // Закрытие по кнопке
    if (filterCloseBtn) {
      filterCloseBtn.addEventListener('click', function () {
        document.documentElement.classList.remove('filter-open');
        filterPanel.classList.remove('filter-open');
      });
    }

    // Закрытие при клике вне области фильтра
    document.addEventListener('click', function (e) {
      const isClickInsideFilter = filterPanel.contains(e.target);
      const isClickOnFilterMob = filterMob === e.target || filterMob.contains(e.target);

      if (!isClickInsideFilter && !isClickOnFilterMob) {
        document.documentElement.classList.remove('filter-open');
        filterPanel.classList.remove('filter-open');
      }
    });
  }

  const filters = document.querySelectorAll('.block-catalog-detail__filter-title');
  const cards = document.querySelectorAll('.card-product');

  if (filters) {
    filters.forEach(button => {
      button.addEventListener('click', function () {
        // Переключаем класс _active у текущей кнопки
        this.classList.toggle('_active');

        // Получаем все активные фильтры
        const activeFilters = Array.from(document.querySelectorAll('.block-catalog-detail__filter-title._active')).map(btn =>
          btn.getAttribute('data-filter')
        );

        // Если нет активных фильтров — показываем всё
        if (activeFilters.length === 0) {
          cards.forEach(card => card.classList.remove('_hide'));
          return;
        }

        // Иначе фильтруем по активным категориям
        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (category && activeFilters.includes(category)) {
            card.classList.remove('_hide');
          } else {
            card.classList.add('_hide');
          }
        });
      });
    });
  }

  let _slideUp = (target, duration = 500, showmore = 0) => {
    if (!target.classList.contains("_slide")) {
      target.classList.add("_slide");
      target.style.transitionProperty = "height, margin, padding";
      target.style.transitionDuration = duration + "ms";
      target.style.height = `${target.offsetHeight}px`;
      target.offsetHeight;
      target.style.overflow = "hidden";
      target.style.height = showmore ? `${showmore}px` : `0px`;
      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;
      window.setTimeout((() => {
        target.hidden = !showmore ? true : false;
        !showmore ? target.style.removeProperty("height") : null;
        target.style.removeProperty("padding-top");
        target.style.removeProperty("padding-bottom");
        target.style.removeProperty("margin-top");
        target.style.removeProperty("margin-bottom");
        !showmore ? target.style.removeProperty("overflow") : null;
        target.style.removeProperty("transition-duration");
        target.style.removeProperty("transition-property");
        target.classList.remove("_slide");
        document.dispatchEvent(new CustomEvent("slideUpDone", {
          detail: {
            target
          }
        }));
      }), duration);
    }
  };
  let _slideDown = (target, duration = 500, showmore = 0) => {
    if (!target.classList.contains("_slide")) {
      target.classList.add("_slide");
      target.hidden = target.hidden ? false : null;
      showmore ? target.style.removeProperty("height") : null;
      let height = target.offsetHeight;
      target.style.overflow = "hidden";
      target.style.height = showmore ? `${showmore}px` : `0px`;
      target.style.paddingTop = 0;
      target.style.paddingBottom = 0;
      target.style.marginTop = 0;
      target.style.marginBottom = 0;
      target.offsetHeight;
      target.style.transitionProperty = "height, margin, padding";
      target.style.transitionDuration = duration + "ms";
      target.style.height = height + "px";
      target.style.removeProperty("padding-top");
      target.style.removeProperty("padding-bottom");
      target.style.removeProperty("margin-top");
      target.style.removeProperty("margin-bottom");
      window.setTimeout((() => {
        target.style.removeProperty("height");
        target.style.removeProperty("overflow");
        target.style.removeProperty("transition-duration");
        target.style.removeProperty("transition-property");
        target.classList.remove("_slide");
        document.dispatchEvent(new CustomEvent("slideDownDone", {
          detail: {
            target
          }
        }));
      }), duration);
    }
  };
  let _slideToggle = (target, duration = 500) => {
    if (target.hidden) return _slideDown(target, duration); else return _slideUp(target, duration);
  };

  //Спойлеры
  function spollers() {
    const spollersArray = document.querySelectorAll("[data-spollers]");
    if (spollersArray.length > 0) {

      // Функция инициализации спойлеров
      function initSpollers(spollersArray, matchMedia = false) {
        spollersArray.forEach((spollersBlock) => {
          spollersBlock = matchMedia ? spollersBlock.item : spollersBlock;
          if (matchMedia.matches || !matchMedia) {
            spollersBlock.classList.add("_spoller-init");
            initSpollerBody(spollersBlock);
            spollersBlock.addEventListener("click", setSpollerAction);
          } else {
            spollersBlock.classList.remove("_spoller-init");
            initSpollerBody(spollersBlock, false);
            spollersBlock.removeEventListener("click", setSpollerAction);
          }
        });
      }

      // Настройка тела спойлера (скрытие/показ)
      function initSpollerBody(spollersBlock, hideSpollerBody = true) {
        const spollerItems = spollersBlock.querySelectorAll(".spollers__item");
        if (spollerItems.length) {
          spollerItems.forEach((spollerItem) => {
            const content = spollerItem.querySelector(".spollers__body");
            if (content) {
              if (hideSpollerBody) {
                if (!spollerItem.classList.contains("_spoller-active")) {
                  content.hidden = true;
                }
              } else {
                content.hidden = false;
              }
            }
          });
        }
      }

      // Логика открытия/закрытия спойлера
      function setSpollerAction(e) {
        const el = e.target;
        const spollerTitle = el.closest("[data-spoller]");

        if (spollerTitle) {
          // Ищем .spollers__title как родителя, где живёт data-spoller
          const spollerItem = spollerTitle.closest(".spollers__item");
          if (!spollerItem) return;

          const content = spollerItem.querySelector(".spollers__body");
          if (!content) return;

          const spollersBlock = spollerItem.closest("[data-spollers]");
          const oneSpoller = spollersBlock.hasAttribute("data-one-spoller");
          const spollerSpeed = parseInt(spollersBlock.dataset.spollersSpeed) || 500;

          // Защита от повторной анимации
          if (spollersBlock.querySelectorAll("._slide").length > 0) return;

          // Если аккордеон — закрываем другие
          if (oneSpoller && !spollerItem.classList.contains("_spoller-active")) {
            hideSpollersBody(spollersBlock);
          }

          // Переключаем класс и анимируем
          spollerItem.classList.toggle("_spoller-active");
          _slideToggle(content, spollerSpeed);

          e.preventDefault();
        }
      }

      // Закрывает активный спойлер, если используется data-one-spoller
      function hideSpollersBody(spollersBlock) {
        const activeItem = spollersBlock.querySelector(".spollers__item._spoller-active");
        if (!activeItem) return;

        const content = activeItem.querySelector(".spollers__body");
        const spollerSpeed = spollersBlock.dataset.spollersSpeed
          ? parseInt(spollersBlock.dataset.spollersSpeed)
          : 500;

        if (!spollersBlock.querySelectorAll("._slide").length) {
          activeItem.classList.remove("_spoller-active");
          _slideUp(content, spollerSpeed);
        }
      }

      // Закрытие по клику вне блока
      const spollersClose = document.querySelectorAll("[data-spoller-close]");
      if (spollersClose.length) {
        document.addEventListener("click", (e) => {
          const el = e.target;
          if (!el.closest("[data-spollers]")) {
            spollersClose.forEach((spollerClose) => {
              const spollersBlock = spollerClose.closest("[data-spollers]");
              const spollerSpeed = spollersBlock.dataset.spollersSpeed
                ? parseInt(spollersBlock.dataset.spollersSpeed)
                : 500;
              spollerClose.classList.remove("_spoller-active");
              _slideUp(spollerClose.nextElementSibling, spollerSpeed);
            });
          }
        });
      }

      // Инициализируем все найденные спойлеры
      initSpollers(Array.from(spollersArray));

    }
  }
  spollers()


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

  AW.initSliderBrands = function ($el) {
    const $wrapper = $('[data-swiper-wrapper="brands"]');
    const $navNext = $wrapper.find('.swiper-nav_next');
    const $navPrev = $wrapper.find('.swiper-nav_prev');
    const $slides = $el.find('.swiper-slide');
    return new Swiper($el[0], {
      spaceBetween: 4,
      slidesPerView: 20,
      speed: 200,
      navigation: {
        nextEl: $navNext[0],
        prevEl: $navPrev[0],
      },
      breakpoints: {
        0: { slidesPerView: 1.5, spaceBetween: 10 },
        375: { slidesPerView: 2.1, spaceBetween: 10 },
        768: { slidesPerView: 2.5, spaceBetween: 10 },
        1200: { slidesPerView: 3.2, spaceBetween: 20 },
        1400: { slidesPerView: 4, spaceBetween: 20 }
      }
    });
  }
  $('[data-swiper="photo"]').each(function () {
    AW.initSliderBrands($(this));
  });

  AW.initProductSlider = function ($el) {
    const $wrapper = $('[data-swiper-wrapper="product-card"]');

    // Навигация для thumbs
    const $navThumbsNext = $wrapper.find('.top-block-product__thumbs .swiper-nav_next')[0];
    const $navThumbsPrev = $wrapper.find('.top-block-product__thumbs .swiper-nav_prev')[0];

    // Навигация для основного слайдера
    const $navMainNext = $wrapper.find('.top-block-product__slider .swiper-nav_next')[0];
    const $navMainPrev = $wrapper.find('.top-block-product__slider .swiper-nav_prev')[0];

    let thumbsSwiper;
    let mainSwiper;

    // Инициализация thumbsSwiper
    thumbsSwiper = new Swiper('.top-block-product__thumbs .swiper-thumbs', {
      slidesPerView: 4,
      spaceBetween: 10,
      direction: 'vertical',
      speed: 400,
      watchSlidesProgress: true,
      navigation: {
        nextEl: $navThumbsNext,
        prevEl: $navThumbsPrev,
      },
      breakpoints: {
        0: {
          direction: 'horizontal',
          slidesPerView: 4,
        },
        1100: {
          direction: 'vertical',
          slidesPerView: 4,
        },
      },
    });

    // Инициализация mainSwiper
    mainSwiper = new Swiper('.top-block-product__slider .swiper-product-card', {
      thumbs: {
        swiper: thumbsSwiper,
      },
      slidesPerView: 1,
      spaceBetween: 2,
      speed: 400,
      navigation: {
        nextEl: $navMainNext,
        prevEl: $navMainPrev,
      },
      watchSlidesProgress: true,
    });

    // Слушаем клик по кнопкам миниатюр и переключаем главный слайдер
    if ($navThumbsNext && $navThumbsPrev) {
      $navThumbsNext.addEventListener('click', () => {
        mainSwiper.slideNext();
      });

      $navThumbsPrev.addEventListener('click', () => {
        mainSwiper.slidePrev();
      });
    }
  };
  $('[data-swiper="product-card"]').each(function () {
    AW.initProductSlider($(this));
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

  //Ползунок
  function rangeInit() {
    const ratingSearch = document.querySelector('.filter-catalog-detail__range');
    if (ratingSearch) {
      noUiSlider.create(ratingSearch, {
        start: [0, 22000],
        connect: true,
        range: {
          'min': [0],
          'max': [22000]
        },
        format: wNumb({
          decimals: 0,
          thousand: ' ',
          suffix: ' ₽',
        })
      });

      // Функция для изменения ширины инпута под контент
      function updateInputWidth(inputElement) {
        const div = document.createElement('div');
        div.style.visibility = 'hidden';
        div.style.position = 'absolute';
        div.style.whiteSpace = 'pre';
        div.style.font = window.getComputedStyle(inputElement).font;
        div.style.padding = window.getComputedStyle(inputElement).padding;
        div.textContent = inputElement.value || inputElement.placeholder;
        document.body.appendChild(div);
        inputElement.style.width = div.offsetWidth + 'px';
        document.body.removeChild(div);
      }

      const priceStart = document.getElementById('price-start');
      const priceEnd = document.getElementById('price-end');

      // Связь полей ввода со слайдером
      priceStart.addEventListener('change', function () {
        ratingSearch.noUiSlider.set([this.value, null]);
      });

      priceEnd.addEventListener('change', function () {
        ratingSearch.noUiSlider.set([null, this.value]);
      });

      // Обновляем ширину при вводе текста
      priceStart.addEventListener('input', () => updateInputWidth(priceStart));
      priceEnd.addEventListener('input', () => updateInputWidth(priceEnd));

      // Обновляем значения инпутов при движении слайдера
      ratingSearch.noUiSlider.on('update', function (values, handle) {
        var value = values[handle].replace(' ₽', ''); // Убираем символ валюты

        if (handle) {
          priceEnd.value = value;
          updateInputWidth(priceEnd); // <<< Обновляем ширину
        } else {
          priceStart.value = value;
          updateInputWidth(priceStart); // <<< Обновляем ширину
        }
      });

      // Инициализируем ширину при загрузке
      updateInputWidth(priceStart);
      updateInputWidth(priceEnd);
    }
  }
  rangeInit();

});