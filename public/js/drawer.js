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
      window.getFilterFormData = function() {
        const getValue = (name) => {
          const element = document.querySelector(`[name='${name}']`);
          return element?.getAttribute('data-value') || '';
        };

        return {
          name: getValue('name'),
          orderType: getValue('projectTask'),
          sort: getValue('order'),
          moneyInput: [getValue('amountStart'), getValue('amountEnd')].filter(item => item !== ''),
          ordertime: [getValue('publishStart'), getValue('publishEnd')].filter(item => item !== ''),
          enddatatime: [getValue('deadlineStart'), getValue('deadlineEnd')].filter(item => item !== ''),
          performtime: [getValue('orderStart'), getValue('orderEnd')].filter(item => item !== '')
        };
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
        const formData = window.getFilterFormData();
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