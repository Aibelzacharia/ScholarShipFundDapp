const ScholarshipFund = artifacts.require("ScholarshipFund");

module.exports = function (deployer) {
  deployer.deploy(ScholarshipFund);
};
