export const formatPrice = (number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "USD",
  }).format(number);
};

export const mobileValidate = (number) => {
  const regexpMobile = /^[0-9\b]+$/;
  if (number === "" || regexpMobile.test(number)) {
    return true;
  }
  return false;
};
export const emailValidate = (emailid) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (re.test(emailid)) {
    return true;
  }
  return false;
};
export const getUniqueValues = (data, type) => {
  let unique = data.map((item) => item[type]);
  if (type === "colors") {
    unique = unique.flat();
  }
  return ["all", ...new Set(unique)];
};
export const getUniqueValuesHome = (data, type) => {
  let unique = data.map((item) => item[type]);
  if (type === "colors") {
    unique = unique.flat();
  }
  return [...new Set(unique)];
};

export const isValidHttpUrl = (string) => {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
};

/** Same pattern as createOrder_test — read Endorsely referral and persist to localStorage */
export const getEndorselyReferralId = () => {
  const referralId =
    window.endorsely_referral || localStorage.getItem("endorsely_referral");
  if (referralId) {
    localStorage.setItem("endorsely_referral", referralId);
    return referralId;
  }
  return null;
};
