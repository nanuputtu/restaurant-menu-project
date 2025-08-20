// Make navbar collapse on blur in mobile
$(function () {  
  $("#navbarToggle").blur(function () {
    var screenWidth = window.innerWidth;
    if (screenWidth < 768) {
      $("#collapsable-nav").collapse('hide');
    }
  });
});

(function (global) {
  var dc = {};

  // ----- URLs & snippet paths -----
  var homeHtmlUrl          = "snippets/home-snippet.html";
  var allCategoriesUrl     = "data/categories.json";   // ✅ Local file
  var categoriesTitleHtml  = "snippets/categories-title-snippet.html";
  var categoryHtml         = "snippets/category-snippet.html";
  var menuItemsTitleHtml   = "snippets/menu-items-title.html";
  var menuItemHtml         = "snippets/menu-item.html";

  // ----- Helpers -----
  var insertHtml = function (selector, html) {
    var targetElem = document.querySelector(selector);
    targetElem.innerHTML = html;
  };

  var showLoading = function (selector) {
    var html = "<div class='text-center'>";
    html += "<img src='images/ajax-loader.gif'></div>";
    insertHtml(selector, html);
  };

  var insertProperty = function (string, propName, propValue) {
    var propToReplace = "{{" + propName + "}}";
    return string.replace(new RegExp(propToReplace, "g"), propValue);
  };

  var switchMenuToActive = function () {
    var classes = document.querySelector("#navHomeButton").className;
    classes = classes.replace(new RegExp("active", "g"), "");
    document.querySelector("#navHomeButton").className = classes;

    classes = document.querySelector("#navMenuButton").className;
    if (classes.indexOf("active") === -1) {
      classes += " active";
      document.querySelector("#navMenuButton").className = classes;
    }
  };

  // ----- Initial load -----
  document.addEventListener("DOMContentLoaded", function () {
    showLoading("#main-content");
    $ajaxUtils.sendGetRequest(
      allCategoriesUrl,
      buildAndShowHomeHTML,
      true
    );
  });

  function buildAndShowHomeHTML(categories) {
    $ajaxUtils.sendGetRequest(homeHtmlUrl, function (homeHtml) {
      var chosenCategoryShortName = chooseRandomCategory(categories).short_name;
      var randomCategoryArg = "'" + chosenCategoryShortName + "'";
      var homeHtmlToInsert = insertProperty(
        homeHtml,
        "randomCategoryShortName",
        randomCategoryArg
      );
      insertHtml("#main-content", homeHtmlToInsert);
    }, false);
  }

  function chooseRandomCategory(categories) {
    var randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  }

  // ----- Load Categories -----
  dc.loadMenuCategories = function () {
    showLoading("#main-content");
    $ajaxUtils.sendGetRequest(allCategoriesUrl, buildAndShowCategoriesHTML);
  };

  // ----- Load Items for One Category -----
  dc.loadMenuItems = function (categoryShort) {
    showLoading("#main-content");

    var menuItemsUrl = "data/menu_items_" + categoryShort + ".json";

    $ajaxUtils.sendGetRequest(menuItemsUrl, function (data) {
      if (!data) {
        console.warn("No JSON found for", categoryShort, "falling back...");
        data = { category: categoryShort, menu_items: [] };
      }
      data.categoryShort = categoryShort;
      buildAndShowMenuItemsHTML(data);
    });
  };

  function buildAndShowCategoriesHTML(categories) {
    $ajaxUtils.sendGetRequest(categoriesTitleHtml, function (categoriesTitleHtml) {
      $ajaxUtils.sendGetRequest(categoryHtml, function (categoryHtml) {
        switchMenuToActive();
        var categoriesViewHtml = buildCategoriesViewHtml(categories, categoriesTitleHtml, categoryHtml);
        insertHtml("#main-content", categoriesViewHtml);
      }, false);
    }, false);
  }

  function buildCategoriesViewHtml(categories, categoriesTitleHtml, categoryHtml) {
    var finalHtml = categoriesTitleHtml;
    finalHtml += "<section class='row'>";

    for (var i = 0; i < categories.length; i++) {
      var html = categoryHtml;
      html = insertProperty(html, "name", categories[i].name);
      html = insertProperty(html, "short_name", categories[i].short_name);
      finalHtml += html;
    }

    finalHtml += "</section>";
    return finalHtml;
  }

  function buildAndShowMenuItemsHTML(categoryMenuItems) {
    $ajaxUtils.sendGetRequest(menuItemsTitleHtml, function (menuItemsTitleHtml) {
      $ajaxUtils.sendGetRequest(menuItemHtml, function (menuItemHtml) {
        switchMenuToActive();
        var menuItemsViewHtml = buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml);
        insertHtml("#main-content", menuItemsViewHtml);
      }, false);
    }, false);
  }

  // ✅ FIXED: Handle category as object or string
  function buildMenuItemsViewHtml(categoryMenuItems, menuItemsTitleHtml, menuItemHtml) {
    var categoryName = "";
    if (typeof categoryMenuItems.category === "object" && categoryMenuItems.category.name) {
      categoryName = categoryMenuItems.category.name;
    } else {
      categoryName = categoryMenuItems.category || "";
    }

    menuItemsTitleHtml = insertProperty(menuItemsTitleHtml, "name", categoryName);
    menuItemsTitleHtml = insertProperty(menuItemsTitleHtml, "special_instructions", "");

    var finalHtml = menuItemsTitleHtml;
    finalHtml += "<section class='row'>";

    var menuItems = categoryMenuItems.menu_items || [];
    var catShortName = categoryMenuItems.categoryShort || "";

    for (var i = 0; i < menuItems.length; i++) {
      var html = menuItemHtml;

      html = insertProperty(html, "short_name", menuItems[i].short_name || "");
      html = insertProperty(html, "catShortName", catShortName);

      html = insertItemPrice(html, "price_small", menuItems[i].price_small);
      html = insertItemPortionName(html, "small_portion_name", menuItems[i].small_portion_name);

      html = insertItemPrice(html, "price_large", menuItems[i].price_large);
      html = insertItemPortionName(html, "large_portion_name", menuItems[i].large_portion_name);

      html = insertProperty(html, "name", menuItems[i].name);
      html = insertProperty(html, "description", menuItems[i].description);

      if (i % 2 !== 0) {
        html += "<div class='clearfix visible-lg-block visible-md-block'></div>";
      }
      finalHtml += html;
    }

    finalHtml += "</section>";
    return finalHtml;
  }

  function insertItemPrice(html, pricePropName, priceValue) {
    if (!priceValue) return insertProperty(html, pricePropName, "");
    priceValue = "$" + priceValue.toFixed(2);
    return insertProperty(html, pricePropName, priceValue);
  }

  function insertItemPortionName(html, portionPropName, portionValue) {
    if (!portionValue) return insertProperty(html, portionPropName, "");
    portionValue = "(" + portionValue + ")";
    return insertProperty(html, portionPropName, portionValue);
  }

  global.$dc = dc;
})(window);
