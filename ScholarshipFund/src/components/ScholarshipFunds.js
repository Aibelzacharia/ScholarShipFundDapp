import React, { useEffect, useState } from "react";
import Web3 from "web3";
import ScholarshipFundABI from "../abis/ScholarshipFund.json";
import "bootstrap/dist/css/bootstrap.min.css";
import { Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faInfoCircle,
  faDonate,
  faCheckCircle,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import { Bar } from "react-chartjs-2";
import { Carousel } from 'react-bootstrap';
import "./ScholarshipFund.css";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const scholarshipResources = [
  {
    name: "BRITISH COUNCIL SCHOLARSHIP",
    url: "https://study-uk.britishcouncil.org/scholarships-funding",
    description: "Government scholarships for Indian students.",
  },
  {
    name: "UCAS MONAEY AND STUDENT LIFE",
    url: "https://www.ucas.com/money-and-student-life",
    description: "Higher education scholarships and grants.",
  },
];

const ScholarshipFund = () => {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const heroImages = [
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1541178735493-479c1a27ed24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80"
  ];

  const [formData, setFormData] = useState({
    name: "",
    university: "",
    fundingGoal: "",
    description: "",
  });

  const [scholarshipInfo, setScholarshipInfo] = useState([
    {
      id: 1,
      title: "Application Process",
      content: "Learn how to apply for scholarships effectively",
      type: "guide",
    },
    {
      id: 2,
      title: "Eligibility Criteria",
      content: "Understand the requirements for different scholarships",
      type: "info",
    },
  ]);

  useEffect(() => {
    const loadBlockchainData = async () => {
      if (window.ethereum) {
        try {
          const web3 = new Web3(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3.eth.getAccounts();
    
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            console.error("No accounts found.");
            return;
          }
    
          const networkId = await web3.eth.net.getId();
          console.log("Network ID:", networkId);
          const networkData = ScholarshipFundABI.networks[networkId];
    
          if (networkData) {
            console.log("Contract Address:", networkData.address);
            const contractInstance = new web3.eth.Contract(
              ScholarshipFundABI.abi,
              networkData.address
            );
            setContract(contractInstance);
            refreshScholarships(contractInstance);
          } else {
            console.error("Smart contract not deployed on the current network!");
            alert("Smart contract not deployed on the current network!");
          }
        } catch (error) {
          console.error("Blockchain error:", error);
        }
      } else {
        alert("Please install MetaMask!");
      }
    };    
    loadBlockchainData();
  }, []);

  const refreshScholarships = async (contractInstance) => {
    const scholarships = await contractInstance.methods.getScholarships().call();
    setScholarships(scholarships);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUsername === "admin" && adminPassword === "admin123") {
      setAdminLoggedIn(true);
      setShowAdminLogin(false);
    } else {
      alert("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setAdminLoggedIn(false);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Wallet connection failed:", error);
      }
    } else {
      alert("Please install MetaMask to connect your wallet.");
    }
  };

  const handleScholarshipSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      alert("Contract not initialized or account not connected");
      return;
    }

    try {
      const weiGoal = Web3.utils.toWei(formData.fundingGoal.toString(), "ether");

      if (editingScholarship !== null) {
        await contract.methods
          .updateScholarship(
            editingScholarship,
            formData.name,
            formData.university,
            weiGoal,
            formData.description
          )
          .send({ from: account });
      } else {
        await contract.methods
          .createScholarship(
            formData.name,
            formData.university,
            weiGoal,
            formData.description
          )
          .send({ from: account });
      }

      await refreshScholarships(contract);
      setShowScholarshipModal(false);
      setFormData({ name: "", university: "", fundingGoal: "", description: "" });
    } catch (error) {
      console.error("Scholarship error:", error);
      alert(`Error processing transaction: ${error.message}`);
    }
  };

  const handleDeleteScholarship = async (scholarshipId) => {
    if (window.confirm("Are you sure you want to delete this scholarship?")) {
      await contract.methods.deleteScholarship(scholarshipId).send({ from: account });
      refreshScholarships(contract);
    }
  };

  const withdrawFunds = async (scholarshipId) => {
    if (!contract || !account) return alert("Contract not initialized");
  
    try {
      await contract.methods.withdrawFunds(scholarshipId).send({ from: account });
      alert("Funds withdrawn successfully!");
      await refreshScholarships(contract);
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Failed to withdraw funds.");
    }
  };

  const openEditModal = (scholarship, index) => {
    setEditingScholarship(index);
    setFormData({
      name: scholarship.name,
      university: scholarship.university,
      fundingGoal: Web3.utils.fromWei(scholarship.fundingGoal, "ether"),
      description: scholarship.description,
    });
    setShowScholarshipModal(true);
  };

  const ScholarshipCard = ({ scholarship, index }) => {
    const [contributionAmount, setContributionAmount] = useState("");
    const isFullyFunded = Number(scholarship.amountRaised) >= Number(scholarship.fundingGoal);
    const progress = Math.min(
      (Number(scholarship.amountRaised) / Number(scholarship.fundingGoal)) * 100,
      100
    );

    const handleContribute = async () => {
      if (isFullyFunded) {
        alert("This scholarship has already reached its funding goal. Thank you for your support!");
        return;
      }

      try {
        const weiAmount = Web3.utils.toWei(contributionAmount.toString(), "ether");
        await contract.methods.contribute(index).send({
          from: account,
          value: weiAmount,
        });
        await refreshScholarships(contract);
        setContributionAmount("");
      } catch (error) {
        console.error("Contribution error:", error);
        alert(`Contribution failed: ${error.message}`);
      }
    };

    return (
      <div className={`scholarship-card card mb-4 ${isFullyFunded ? 'completed' : ''}`}>
        {isFullyFunded && (
          <div className="completed-ribbon">
            <FontAwesomeIcon icon={faCheckCircle} /> Fully Funded
          </div>
        )}
        <div className="card-body">
          <h3 className="card-title">
            <FontAwesomeIcon icon={faGraduationCap} /> {scholarship.name}
            {isFullyFunded && (
              <Badge pill className="ml-2" bg="success">
                Funded
              </Badge>
            )}
          </h3>
          <p className="text-muted">{scholarship.university}</p>
          <p className="card-text">{scholarship.description}</p>

          <div className="progress mb-3">
            <div
              className={`progress-bar ${isFullyFunded ? 'bg-success' : ''}`}
              role="progressbar"
              style={{ width: `${progress}%` }}
            >
              {progress.toFixed(1)}%
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <span>Raised: {Web3.utils.fromWei(scholarship.amountRaised, "ether")} ETH</span>
            <span>Goal: {Web3.utils.fromWei(scholarship.fundingGoal, "ether")} ETH</span>
          </div>

          {!adminLoggedIn && !isFullyFunded && (
            <div className="contribution-input input-group">
              <input
                type="number"
                className="form-control"
                placeholder="ETH amount"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
              <div className="input-group-append">
                <button className="btn btn-primary" onClick={handleContribute}>
                  <FontAwesomeIcon icon={faDonate} /> Contribute
                </button>
              </div>
            </div>
          )}

          {adminLoggedIn && (
            <div className="admin-controls">
              <button
                className="btn btn-warning btn-sm mr-2"
                onClick={() => openEditModal(scholarship, index)}
              >
                <FontAwesomeIcon icon={faEdit} /> Edit
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteScholarship(index)}
              >
                <FontAwesomeIcon icon={faTrash} /> Delete
              </button>
              {Number(scholarship.amountRaised) > 0 && (
                <button
                  className="btn btn-success btn-sm ml-2"
                  onClick={() => withdrawFunds(index)}
                >
                  <FontAwesomeIcon icon={faDonate} /> Withdraw Funds
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const UniversityContacts = () => (
    <div className="university-contacts card mt-4">
      <div className="card-body">
        <h4 className="card-title">🏫 University Resources</h4>
        <ul className="list-group list-group-flush">
          <li className="list-group-item">
            Scholarship Office: <strong>scholarships@university.edu</strong>
          </li>
          <li className="list-group-item">
            Financial Aid: <strong>+1 (555) 123-4567</strong>
          </li>
          <li className="list-group-item">
            Admissions: <strong>admissions@university.edu</strong>
          </li>
        </ul>
      </div>
    </div>
  );

  const activeScholarships = scholarships.filter(
    (scholarship) => Number(scholarship.amountRaised) < Number(scholarship.fundingGoal)
  );
  const completedScholarships = scholarships.filter(
    (scholarship) => Number(scholarship.amountRaised) >= Number(scholarship.fundingGoal)
  );

  const chartData = {
    labels: scholarships.map((scholarship) => scholarship.name),
    datasets: [
      {
        label: "Amount Raised (ETH)",
        data: scholarships.map((scholarship) =>
          Web3.utils.fromWei(scholarship.amountRaised, "ether")
        ),
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="scholarship-fund-container">
      {adminLoggedIn ? (
        <div className="admin-dashboard">
          <nav className="admin-navbar navbar navbar-dark bg-primary">
            <span className="navbar-brand">Admin Dashboard</span>
            <button className="btn btn-success" onClick={connectWallet}>
              {account ? `Connected: ${account.substring(0, 6)}...` : "Connect Wallet"}
            </button>
            <button className="btn btn-light" onClick={handleLogout}>
              Logout
            </button>
          </nav>

          <div className="container mt-4">
            <div className="d-flex justify-content-between mb-4">
              <h2>Manage Scholarships</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingScholarship(null);
                  setFormData({
                    name: "",
                    university: "",
                    fundingGoal: "",
                    description: "",
                  });
                  setShowScholarshipModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlus} /> New Scholarship
              </button>
            </div>

            <div className="row">
              <div className="col-md-8">
                {scholarships.map((scholarship, index) => (
                  <ScholarshipCard key={index} scholarship={scholarship} index={index} />
                ))}
              </div>
              <div className="col-md-4">
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="card-title">Scholarship Metrics</h5>
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="user-interface">
          <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container">
              <span className="navbar-brand font-weight-bold">
                <FontAwesomeIcon icon={faGraduationCap} /> Scholarship Fund Network
              </span>
              <button
                className="btn btn-light ml-auto"
                onClick={() => setShowAdminLogin(true)}
              >
                Admin Login
              </button>
            </div>
          </nav>

          <Carousel fade interval={5000} className="hero-carousel">
            {heroImages.map((img, index) => (
              <Carousel.Item key={index}>
                <div 
                  className="hero-slide"
                  style={{ backgroundImage: `url(${img})` }}
                >
                  <div className="carousel-caption">
                    <h2 className="animated fadeInUp">Invest in Education, Change Lives</h2>
                    <p className="animated fadeInUp delay-1">Support students through blockchain-powered scholarships</p>
                    <button 
                      className="btn btn-lg btn-primary animated fadeInUp delay-2"
                      onClick={connectWallet}
                    >
                      {account ? `Connected: ${account.substring(0, 6)}...` : "Connect Wallet to Contribute"}
                    </button>
                  </div>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>

          {showAdminLogin && (
            <div className="modal show" style={{ display: "block" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Admin Login</h5>
                    <button
                      className="close"
                      onClick={() => setShowAdminLogin(false)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={handleAdminLogin}>
                      <div className="form-group">
                        <label>Username</label>
                        <input
                          type="text"
                          className="form-control"
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        Login
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="container mt-4">
            <div className="row">
              <div className="col-md-6">
                <div className="scholarship-info-sidebar">
                  <h4 className="mb-3">
                    <FontAwesomeIcon icon={faInfoCircle} /> Scholarship Resources
                  </h4>

                  {scholarshipInfo.map((info) => (
                    <div key={info.id} className="info-card card mb-3">
                      <div className="card-body">
                        <h5 className="card-title">{info.title}</h5>
                        <p className="card-text">{info.content}</p>
                        <button className="btn btn-outline-primary btn-sm">
                          Learn More
                        </button>
                      </div>
                    </div>
                  ))}
                  <UniversityContacts />
                </div>
              </div>

              <div className="col-md-6">
                <h2 className="mb-4">Active Scholarships</h2>
                {activeScholarships.length > 0 ? (
                  activeScholarships.map((scholarship, index) => (
                    <ScholarshipCard key={index} scholarship={scholarship} index={index} />
                  ))
                ) : (
                  <div className="alert alert-info">
                    No active scholarships at the moment. Check back later!
                  </div>
                )}

                <h2 className="mt-5 mb-4">Fully Funded Scholarships</h2>
                {completedScholarships.length > 0 ? (
                  completedScholarships.map((scholarship, index) => (
                    <ScholarshipCard key={index} scholarship={scholarship} index={index} />
                  ))
                ) : (
                  <div className="alert alert-info">
                    No fully funded scholarships yet.
                  </div>
                )}
              </div>
            </div>

            <div className="row mt-5">
              <div className="col-md-12">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">Scholarship Resources</h4>
                    <ul className="list-group">
                      {scholarshipResources.map((site, index) => (
                        <li key={index} className="list-group-item">
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {site.name}
                          </a>
                          <p className="text-muted">{site.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScholarshipModal && (
        <div className="modal show" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingScholarship !== null ? "Edit Scholarship" : "Create Scholarship"}
                </h5>
                <button
                  className="close"
                  onClick={() => setShowScholarshipModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleScholarshipSubmit}>
                  <div className="form-group">
                    <label>Scholarship Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>University</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.university}
                      onChange={(e) =>
                        setFormData({ ...formData, university: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Funding Goal (ETH)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.fundingGoal}
                      onChange={(e) =>
                        setFormData({ ...formData, fundingGoal: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {editingScholarship !== null ? "Update" : "Create"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipFund;