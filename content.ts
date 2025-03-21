import { CHROME_MESSAGES } from "~constants";

const isSupported = (): boolean => {
  const { PLASMO_PUBLIC_SUPPORTED_ORIGIN } = process.env;
  const origin = location.origin;

  return PLASMO_PUBLIC_SUPPORTED_ORIGIN === origin;
};

const moveProfilePage = async () => {
  const btnProfile = document.querySelector('[href="/activity"]')?.parentElement?.nextElementSibling?.firstChild as HTMLElement;
  if (btnProfile) {
    const current = btnProfile.getAttribute("aria-current");
    if (current === "page") {
      return;
    }

    // 1. グロナビのプロフィールリンクをクリック
    btnProfile.click();
  }
};

const openFollowModal = () => {
  const btnFollower = Array.from(document.querySelectorAll("span[dir='auto']"))
    .filter(el => el.textContent.includes("フォロワー"))
    ?.[0]?.parentElement?.parentElement;
  if (!btnFollower) {
    alert("エラーが発生しました。\n画面をリロードしてから再実行してください");
    throw "フォローモーダルが表示できない";
  }

  // 2. フォロワーn人ボタンをクリック
  btnFollower.click();
};

const switchFollowingTab = () => {
  const btnFollowed = document.querySelector('[aria-label="フォロー中"][role="button"]') as HTMLElement;
  if (!btnFollowed) {
    alert("エラーが発生しました。\n画面をリロードしてから再実行してください");
    throw "フォロー中タブに切り替えられない";
  }

  // 3. フォロー中タブをクリック
  btnFollowed.click();
};

const unfollow = async (delay: number, count: number = 1) => {
  const btnFollowings = Array.from(document.querySelectorAll("div"))
  .filter(el => (
    el.textContent.includes("フォロー中") &&
    el.getAttribute("role") === "button" &&
    !el.getAttribute("aria-label")
  ));

  if (!btnFollowings.length) {
    if (count === 1) {
      alert("エラーが発生しました。\n画面をリロードしてから再実行してください");
      throw "フォロー解除できるユーザーが存在しない";
    }

    alert("処理が完了しました");
    return;
  }

  // 4. (フォロー中の)先頭ユーザーのフォロー中ボタンをクリック
  btnFollowings[0].click();
  await new Promise(resolve => setTimeout(resolve, delay));

  const btnUnfollow = Array.from(document.querySelectorAll("div"))
  .filter(el => (
    el.textContent.includes("フォローをやめる") &&
    el.getAttribute("role") === "button" &&
    !el.getAttribute("aria-label")
  ))?.[0];

  // 失敗しても全体が終了するまで続ける
  // if (!btnUnfollow) {
  //   throw "フォロー解除に失敗";
  // }

  // 5. フォローをやめるボタンをクリック
  btnUnfollow.click();
  await new Promise(resolve => setTimeout(resolve, delay));

  // 6. 4-5の再帰
  unfollow(delay, count + 1);
};

/**
 * シーケンス
 * 1. グロナビのプロフィールリンクをクリック -> プロフィールページに遷移
 * 2. フォロワーn人ボタンをクリック -> フォロワー・フォロー中モーダル表示
 * 3. フォロー中タブをクリック -> フォロー中一覧タブを表示
 * 4. 先頭ユーザーのフォロー中ボタンをクリック -> フォロー解除モーダル表示
 * 5. フォローをやめるボタンをクリック -> フォロー解除されて解除モーダル閉じる
 * 6. 4に戻る (4~5の再帰処理)
**/
const execute = async (delay: number) => {
  console.log("execute", delay);

  try {
    moveProfilePage();
    await new Promise(resolve => setTimeout(resolve, delay + 1000)) ;

    openFollowModal();
    await new Promise(resolve => setTimeout(resolve, delay + 1000)) ;

    switchFollowingTab();
    await new Promise(resolve => setTimeout(resolve, delay + 2000)) ;

    unfollow(delay);
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
