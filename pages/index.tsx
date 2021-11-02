import React from "react";

const getStuff = async (url: string) => {
  const fetched = await fetch(url);
  const json = await fetched.json();

  return json;
};

const Index = () => {
  // const [provider, setProvider] = useState<ethers.providers.Web3Provider>();
  // const [account, setAccount] = useState<string>();
  const [holders, setHolders] = React.useState([]);
  const [contractAddr, setContractAddr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleChangeContractAddr = (e) => setContractAddr(e.target.value);

  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      const h = await getStuff(`/api/holders/${contractAddr}`);

      setHolders(h);
      setLoading(false);
    },
    [contractAddr]
  );

  const totalTxs = React.useMemo(
    () => holders.reduce((acc, h) => acc + h.numTxs, 0),
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
      <header>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            onChange={handleChangeContractAddr}
            value={contractAddr}
          />
          <button type="submit">Find Tokens</button>
        </form>
      </header>

      {loading ? (
        "Loading..."
      ) : (
        <table>
          <tbody>
            {holders.map((h, idx) => {
              return (
                <tr key={h.contractAddress}>
                  <td style={{ textAlign: "right" }}>{idx + 1}.</td>
                  <td>{h.tokenSymbol}</td>
                  <td>{h.tokenName}</td>

                  <td>
                    <meter value={h.numTxs / totalTxs} />
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
