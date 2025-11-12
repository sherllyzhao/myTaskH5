// 全局函数定义，确保在HTML元素之前加载
      function openFilterDrawer() {
        const drawer = document.getElementById("filterDrawer");
        if (drawer) {
          drawer.classList.add("active");
          document.body.style.overflow = "hidden";
        }
      }

      function closeFilterDrawer(event) {
        if (event && event.target !== event.currentTarget) return;
        const drawer = document.getElementById("filterDrawer");
        if (drawer) {
          drawer.classList.remove("active");
          document.body.style.overflow = "";
        }
      }

      function resetFilters() {
        const selects = document.querySelectorAll(".mobile-picker-trigger");
        const inputs = document.querySelectorAll(".filter-input");

        selects.forEach((select) => {
          select.setAttribute("data-value", "");
          select.textContent = select.getAttribute("data-default") || "请选择";
          select.classList.remove("selected");
        });
        inputs.forEach((input) => (input.value = ""));
      }

      // 全局筛选工具函数 - 直接复制utils中的逻辑
      // 默认字段配置
      const defaultFieldConfig = {
        // 单值字段: { 返回字段名: 表单name属性 }
        singleFields: {
          name: 'name',
          orderType: 'projectTask',
          sort: 'order'
        },
        // 范围字段: { 返回字段名: [开始name, 结束name] }
        rangeFields: {
          moneyInput: ['amountStart', 'amountEnd'],
          ordertime: ['publishStart', 'publishEnd'],
          enddatatime: ['deadlineStart', 'deadlineEnd'],
          performtime: ['orderStart', 'orderEnd']
        }
      };

      window.getFilterFormData = function(fieldConfig = defaultFieldConfig) {
        const getValue = (name) => {
          const element = document.querySelector(`[name='${name}']`);
          return element?.getAttribute('data-value') || '';
        };

        const result = {};

        // 处理单值字段
        if (fieldConfig.singleFields) {
          Object.entries(fieldConfig.singleFields).forEach(([resultKey, formName]) => {
            result[resultKey] = getValue(formName);
          });
        }

        // 处理范围字段
        if (fieldConfig.rangeFields) {
          Object.entries(fieldConfig.rangeFields).forEach(([resultKey, formNames]) => {
            result[resultKey] = formNames.map(name => getValue(name)).filter(item => item !== '');
          });
        }

        return result;
      };

      // 全局 getValue 函数
      window.getValue = function(name) {
        const element = document.querySelector(`[name='${name}']`);
        if(!element){
          console.log(name + '不存在')
          return ''
        }
        return element.value
      }

      function applyFilters(callback) {
        // 优先使用页面级配置，如果没有则使用默认配置
        const fieldConfig = window.pageFieldConfig || undefined;
        const formData = window.getFilterFormData(fieldConfig);
        console.log('筛选数据:', formData);

        // 显示手动加载指示器
        const manualLoadingIndicator = document.getElementById('manualLoadingIndicator');
        if (manualLoadingIndicator) {
          manualLoadingIndicator.style.display = 'block';
        }

        closeFilterDrawer();
        callback && callback(formData);
      }

      window.addEventListener("load", function () {
        // ESC键关闭抽屉
        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            closeFilterDrawer();
          }
        });
      });