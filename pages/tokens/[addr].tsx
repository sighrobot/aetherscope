import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

const getStuff = async (url: string) => {
  const fetched = await fetch(url);
  const json = await fetched.json();

  return json;
};

const Index = () => {
  const router = useRouter();
  // const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  // const [account, setAccount] = useState<string>();
  const [holders, setHolders] = React.useState({ results: [], stats: {} });
  const [contract, setContract] = React.useState(null);
  const [contractAddr, setContractAddr] = React.useState(
    router.query.addr ?? ""
  );
  const [loading, setLoading] = React.useState(false);

  const handleChangeContractAddr = (e) => setContractAddr(e.target.value);

  const getTokens = async (a) => {
    if (a) {
      setLoading(true);
      const stuff = await getStuff(`/api/holders/${a}`);

      const c = stuff.results.filter((hh) => hh.contractAddress === a)[0];
      setContract(c);
      setHolders(stuff);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (router.query.addr) {
      setContractAddr(router.query.addr);
    }

    getTokens(router.query.addr);
  }, [router.query.addr]);

  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault();
      getTokens(contractAddr);
    },
    [contractAddr]
  );

  const totalTxs = React.useMemo(
    () =>
      holders.results
        .filter((h) => h.contractAddress !== contractAddr)
        .reduce((acc, h) => acc + h.numTxs, 0),
    [holders]
  );

  const total = React.useMemo(
    () =>
      holders.results
        .filter((h) => h.contractAddress !== contractAddr)
        .reduce((acc, h) => acc + h.numTxs, 0),
    [holders]
  );

  // const connect = async () => {
  //   if (!window.ethereum?.request) {
  //     alert("MetaMask is not installed!");
  //     return;
  //   }

  //   const provider = new ethers.providers.Web3Provider(window.ethereum);
  //   const accounts = await window.ethereum.request({
  //     method: "eth_requestAccounts",
  //   });

  //   setProvider(provider);
  //   setAccount(accounts[0]);
  // };

  return (
    <main>
      {/* <button onClick={connect}>Connect</button> */}
      {/* <p>Account: {account}</p> */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          onChange={handleChangeContractAddr}
          value={contractAddr}
        />
        <button type="submit">Search</button>
      </form>

      <header>
        {contract && !loading && (
          <h1>
            {contract.tokenName}{" "}
            {contract.tokenName.toLowerCase() !==
              contract.tokenSymbol.toLowerCase() && `(${contract.tokenSymbol})`}
          </h1>
        )}
      </header>

      {holders.results.length > 0 && !loading && (
        <p>
          The top 25 hodlers own{" "}
          <strong>{Math.round(holders.stats.totalPct * 100)}%</strong> of this
          token.
        </p>
      )}

      {holders.results.length > 0 && !loading && (
        <aside>
          These whales have transacted in other tokens{" "}
          <strong>{totalTxs.toLocaleString()}</strong> times in the last three
          days.
        </aside>
      )}

      {loading ? (
        <div id="loading">Loading...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>TXs</th>
              <th>Trackers</th>
            </tr>
          </thead>
          <tbody>
            {holders.results
              .filter((h) => h.contractAddress !== contractAddr)
              .map((h, idx) => {
                return (
                  <tr key={h.contractAddress}>
                    <td>
                      <Link href={`/tokens/${h.contractAddress}`}>
                        <a>
                          {h.tokenName}{" "}
                          {h.tokenName.toLowerCase() !==
                            h.tokenSymbol.toLowerCase() && `(${h.tokenSymbol})`}
                        </a>
                      </Link>
                    </td>
                    <td>{h.numTxs}</td>
                    <td>
                      <Link
                        href={`https://app.zerion.io/invest/asset/${h.contractAddress}`}
                      >
                        <a target="_blank">
                          <img src="/zerion.png" />
                        </a>
                      </Link>

                      <Link
                        href={`https://etherscan.io/token/${h.contractAddress}#balances`}
                      >
                        <a target="_blank">
                          <img src="/etherscan.webp" />
                        </a>
                      </Link>

                      <Link
                        href={`https://www.dextools.io/app/ether/pair-explorer/${h.contractAddress}`}
                      >
                        <a target="_blank">
                          <img src="/dextools.png" />
                        </a>
                      </Link>

                      <Link
                        href={`https://dex.guru/token/${h.contractAddress}`}
                      >
                        <a target="_blank">
                          <img src="/dexguru.png" />
                        </a>
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </main>
  );
};

export default Index;
