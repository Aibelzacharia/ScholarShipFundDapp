// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ScholarshipFund {
    address public admin;

    struct Scholarship {
        string name;
        string university;  // Changed from "location" for clarity
        uint256 amountRaised;
        uint256 fundingGoal;  // Changed from "goal"
        bool isActive;
        address payable creator;
    }

    Scholarship[] public scholarships;
    mapping(uint256 => mapping(address => uint256)) public contributions;  // Changed from "donations"

    event ScholarshipCreated(uint256 scholarshipId, string name, string university, uint256 fundingGoal);
    event ContributionReceived(uint256 scholarshipId, address contributor, uint256 amount);  // Changed from "Donated"
    event FundsWithdrawn(uint256 scholarshipId, address admin, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action.");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createScholarship(
        string memory _name,
        string memory _university,
        uint256 _fundingGoal
    ) public onlyAdmin {
        scholarships.push(
            Scholarship(_name, _university, 0, _fundingGoal, true, payable(msg.sender))
        );
        emit ScholarshipCreated(scholarships.length - 1, _name, _university, _fundingGoal);
    }

    function contribute(uint256 _scholarshipId) public payable {  // Changed from "donate"
        require(scholarships[_scholarshipId].isActive, "Scholarship is not active.");
        require(msg.value > 0, "Contribution must be greater than 0.");

        scholarships[_scholarshipId].amountRaised += msg.value;
        contributions[_scholarshipId][msg.sender] += msg.value;

        emit ContributionReceived(_scholarshipId, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 _scholarshipId) public onlyAdmin {
        Scholarship storage scholarship = scholarships[_scholarshipId];
        require(scholarship.amountRaised > 0, "No funds available.");

        uint256 amount = scholarship.amountRaised;
        scholarship.amountRaised = 0;
        scholarship.creator.transfer(amount);

        emit FundsWithdrawn(_scholarshipId, msg.sender, amount);
    }

    function getScholarships() public view returns (Scholarship[] memory) {
        return scholarships;
    }
}