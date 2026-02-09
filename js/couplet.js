(function () {
  // 判断是否在春节期间
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const inSeason =
    (month === 1 && day >= 20) || month === 2 || (month === 3 && day <= 5);

  if (!inSeason) return;

  // 春联内容
  const couplet = {
    left: "春風得意迎新歲",
    right: "瑞雪纷飞送旧年",
    top: "萬事如意",
  };

  // 创建 DOM
  function createScroll(side, text) {
    const wrap = document.createElement("div");
    wrap.className = "couplet-" + side;
    const scroll = document.createElement("div");
    scroll.className = side === "top" ? "couplet-top-scroll" : "couplet-scroll";
    scroll.textContent = text;
    wrap.appendChild(scroll);
    return wrap;
  }

  const left = createScroll("left", couplet.left);
  const right = createScroll("right", couplet.right);
  const top = createScroll("top", couplet.top);

  document.body.appendChild(left);
  document.body.appendChild(right);
  document.body.appendChild(top);

  // 延迟显示（等页面加载完成后淡入）
  requestAnimationFrame(() => {
    setTimeout(() => {
      left.classList.add("show");
      right.classList.add("show");
      top.classList.add("show");
    }, 800);
  });
})();
