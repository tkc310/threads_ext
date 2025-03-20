import { CHROME_MESSAGES } from "~constants";

const isSupported = (): boolean => {
  const { PLASMO_PUBLIC_SUPPORTED_ORIGIN } = process.env;
  const origin = location.origin;

  return PLASMO_PUBLIC_SUPPORTED_ORIGIN === origin;
};

const execute = (delay: number) => {
  console.log("execute", delay);

  try {
    const btnProfile = document.querySelector('[href="/activity"]')?.parentElement?.nextElementSibling?.firstChild as HTMLElement;
    if (btnProfile) {
      const current = btnProfile.getAttribute("aria-current");
      if (current !== "page") {
        btnProfile.click();
      }
    }

    const unfollow = (count: number = 1) => {
      const btnFollowings = Array.from(document.querySelectorAll("div"))
      .filter(el => (
        el.textContent.includes("フォロー中") &&
        el.getAttribute("role") === "button" &&
        !el.getAttribute("aria-label")
      ));

      if (!btnFollowings.length) {
        if (count === 1) {
          alert("エラーが発生しました。\n画面をリロードしてから再実行してください");
          throw "フォロー中のユーザーが存在しない";
        }

        alert("処理が完了しました");
        return;
      }

      btnFollowings[0].click();
      setTimeout(() => {
        const btnUnfollow = Array.from(document.querySelectorAll("div"))
        .filter(el => (
          el.textContent.includes("フォローをやめる") &&
          el.getAttribute("role") === "button" &&
          !el.getAttribute("aria-label")
        ))?.[0];

        btnUnfollow.click();

        setTimeout(() => {
          unfollow(count + 1);
        }, delay);
      }, delay);
    };

    setTimeout(() => {
      const btnFollower = Array.from(document.querySelectorAll("span[dir='auto']"))
      .filter(el => el.textContent.includes("フォロワー"))?.[0]?.parentElement?.parentElement;
      if (!btnFollower) {
        alert("エラーが発生しました。\n画面をリロードしてから再実行してください");
        throw "フォロワーボタンが見つからない";
      }
      btnFollower.click();

      setTimeout(() => {
        const btnFollowed = document.querySelector('[aria-label="フォロー中"][role="button"]') as HTMLElement;
        if (!btnFollowed) {
          alert("エラーが発生しました。\n画面をリロードしてから再実行してください");
          throw "フォロー中ボタンが見つからない";
        }
        btnFollowed.click();

        setTimeout(() => {
          unfollow();
        }, delay + 2000);
      }, delay + 1000);
    }, delay + 1000)
  } catch (error) {
    console.log(error);
    alert("エラーが発生しました。\n画面をリロードしてから再実行してください");
  }
};

const initialize = () => {
  console.log("initialize");

  const supported = isSupported();

  // popup.tsxからイベントを発行
  chrome.runtime.onMessage.addListener(
    async (request, _sender, sendResponse) => {
      if (request.type === CHROME_MESSAGES.EXECUTE) {
        if (!supported) {
          console.log(supported);
          sendResponse({
            type: CHROME_MESSAGES.ERROR.UNSUPPORTED_ORIGIN,
            payload: origin,
          });
          return;
        }

        execute(request.delay);
      }
    }
  );
};
initialize();
