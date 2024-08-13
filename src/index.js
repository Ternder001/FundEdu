import { createApp } from "@deroll/app";
import { encodeFunctionData, getAddress, hexToString } from "viem";
import EduFundAbi from "./EduFundAbi.json";

let contractAddress = "";

const app = createApp({
  url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004",
});

app
  .start()
  .then(() => {
    app.addAdvanceHandler(async ({ payload, metadata }) => {
      const payloadString = hexToString(payload);
      console.log("Payload received:", payloadString);
      const jsonPayload = JSON.parse(payloadString);

      try {
        if (jsonPayload.method === "set_address") {
          contractAddress = getAddress(metadata.account);
          console.log("Contract address set:", contractAddress);
        } else if (jsonPayload.method === "create_project") {
          const callData = encodeFunctionData({
            abi: EduFundAbi,
            functionName: "createProject",
            args: [
              jsonPayload.title,
              jsonPayload.description,
              jsonPayload.goal,
              jsonPayload.duration,
            ],
          });

          await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          console.log("Project creation request sent.");
        } else if (jsonPayload.method === "contribute") {
          const callData = encodeFunctionData({
            abi: EduFundAbi,
            functionName: "contribute",
            args: [jsonPayload.projectId, jsonPayload.amount],
          });

          await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          console.log("Contribution request sent.");
        } else if (jsonPayload.method === "withdraw_funds") {
          const callData = encodeFunctionData({
            abi: EduFundAbi,
            functionName: "withdrawFunds",
            args: [jsonPayload.projectId],
          });

          await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          console.log("Withdraw funds request sent.");
        }
      } catch (error) {
        console.error("Error handling advance:", error);
      }

      return "accept";
    });

    app.addInspectHandler(async ({ payload }) => {
      const payloadString = hexToString(payload);
      console.log("Payload received for inspection:", payloadString);
      const jsonPayload = JSON.parse(payloadString);

      try {
        if (jsonPayload.method === "get_project") {
          const callData = encodeFunctionData({
            abi: EduFundAbi,
            functionName: "getProject",
            args: [jsonPayload.projectId],
          });

          const voucher = await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          const result = await app.GetVoucherResult(voucher.id);
          console.log("Project details:", result.returnValue);
        } else if (jsonPayload.method === "get_contributions") {
          const callData = encodeFunctionData({
            abi: EduFundAbi,
            functionName: "getContributions",
            args: [jsonPayload.projectId],
          });

          const voucher = await app.createVoucher({
            destination: contractAddress,
            payload: callData,
          });
          const result = await app.GetVoucherResult(voucher.id);
          console.log("Contributions:", result.returnValue);
        }
      } catch (error) {
        console.error("Error handling inspection:", error);
      }

      return "accept";
    });
  })
  .catch((e) => {
    console.error("App failed to start:", e);
    process.exit(1);
  });
