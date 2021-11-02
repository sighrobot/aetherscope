import fetch from "node-fetch";
const jsdom = require("jsdom");

const { JSDOM } = jsdom;

const getStuff = async (url) => {
  const fetched = await fetch(url);
  const json = await fetched.json();

  return json;
};

const getHolders = async (contractAddr) => {
  const fetched = await fetch(
    `https://etherscan.io/token/tokenholderchart/${contractAddr}`
  );
  const text = await fetched.text();
  const {
    window: { document },
  } = new JSDOM(text);

  const rows = Array.from(document.querySelectorAll("table tr"));

  const cellsByRow = rows
    .slice(1)
    .map((row) => Array.from(row.querySelectorAll("td")));

  return [
    cellsByRow.map((cells) => {
      const obj = {};
      cells.forEach((cell, idx) => {
        const value = cell.textContent.trim();
        if (idx === 0) {
          obj.rank = parseInt(value, 10);
        }

        if (idx === 1) {
          obj.address = value;
        }

        if (idx === 2) {
          obj.quantity = parseFloat(value.replace(/,/g, ""));
        }

        if (idx === 3) {
          obj.pct = parseFloat(value) / 100;
        }
      });
      return obj;
    }),
    { text },
  ];
};

const getERC20Txs = async (address) =>
  getStuff(
    `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc&apikey=${process.env.ETHERSCAN}`
  );

export default async (req, res) => {
  const now = Date.now();
  const oneWeekAgo = now - 1000 * 60 * 60 * 24 * 7;
  const threeDaysAgo = now - 1000 * 60 * 60 * 24 * 3;
  const { contractAddr } = req.query;
  const [holders, stats] = await getHolders(contractAddr);
  const topTen = holders.filter((h) => h.address.startsWith("0x")).slice(0, 25);

  const totalPct = topTen.reduce((acc, h) => {
    return acc + h.pct;
  }, 0);

  const ercsByAddr = [];

  for (let holder of topTen) {
    await new Promise((resolve) => setTimeout(() => resolve(), 100));

    const erc = await getERC20Txs(holder.address);
    ercsByAddr.push(erc);
  }

  const tokens = {};
  const map = {};

  ercsByAddr.forEach((ercsForAddr) => {
    if (Array.isArray(ercsForAddr.result)) {
      const oneWeek = ercsForAddr.result.filter((e) => {
        return parseInt(e.timeStamp, 10) * 1000 > threeDaysAgo;
      });
      oneWeek.forEach(({ contractAddress: key, ...rest }) => {
        map[key] = map[key] ? map[key] + 1 : 1;
        if (!tokens[key]) {
          tokens[key] = {
            contractAddress: key,
            tokenSymbol: rest.tokenSymbol,
            tokenName: rest.tokenName,
            tokenDecimal: rest.tokenDecimal,
          };
        }
      });
    }
  });

  const results = [];

  Object.keys(map)
    .sort((k1, k2) => (map[k1] < map[k2] ? 1 : -1))
    .filter(
      (key) =>
        !tokens[key].tokenName.startsWith("Uniswap V") &&
        map[key] > 1 &&
        // key !== contractAddr &&
        !["WETH", "USDC", "USDT"].includes(tokens[key].tokenSymbol)
    )
    // .slice(0, 25)
    .forEach((key) => {
      results.push({
        ...tokens[key],
        numTxs: map[key],
      });
    });

  return res
    .status(200)
    .json({
      results,
      stats: { totalPct, topTen, contractAddr, text: stats.text },
    });
};
