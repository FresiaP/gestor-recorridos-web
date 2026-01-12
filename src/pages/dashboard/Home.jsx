import AssignmentIcon from "@mui/icons-material/Assignment";
import DevicesIcon from "@mui/icons-material/Devices";
import PeopleIcon from "@mui/icons-material/People";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { getDashboard } from "../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Home() {
    const [data, setData] = useState(null);

    useEffect(() => {
        getDashboard().then(setData).catch(err => console.error(err));
    }, []);

    if (!data) return <Typography>Cargando...</Typography>;

    const chartData = {
        labels: data.consumosMensuales.map(c => c.mes),
        datasets: [
            {
                label: "Consumos Mensuales",
                data: data.consumosMensuales.map(c => c.total),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Consumos Mensuales" },
        },
    };

    return (
        <div style={{ padding: "20px" }}>
            <Typography
                variant="h2"
                gutterBottom
                sx={{ mt: 4, color: "primary.main", fontWeight: "bold", textAlign: "center" }}
            >
                Dashboard
            </Typography>

            {/* Bloque de tarjetas */}
            <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: "#90caf9", color: "#0d47a1", boxShadow: 3, borderRadius: 2, height: "100%" }}>
                        <CardContent>
                            <PeopleIcon fontSize="large" />
                            <Typography variant="h6">Total Usuarios</Typography>
                            <Typography variant="h5">{data.totalUsuarios}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: "#a5d6a7", color: "#1b5e20", boxShadow: 3, borderRadius: 2, height: "100%" }}>
                        <CardContent>
                            <VerifiedUserIcon fontSize="large" />
                            <Typography variant="h6">Usuarios Activos</Typography>
                            <Typography variant="h5">{data.usuariosActivos}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: "#ffcc80", color: "#e65100", boxShadow: 3, borderRadius: 2, height: "100%" }}>
                        <CardContent>
                            <DevicesIcon fontSize="large" />
                            <Typography variant="h6">Dispositivos Operativos</Typography>
                            <Typography variant="h5">{data.dispositivosOperativos}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: "#fff59d", color: "#f57f17", boxShadow: 3, borderRadius: 2, height: "100%" }}>
                        <CardContent>
                            <AssignmentIcon fontSize="large" />
                            <Typography variant="h6">Contratos por vencer</Typography>
                            <Typography variant="h5">{data.contratosPorVencer}</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: "#ef9a9a", color: "#b71c1c", boxShadow: 3, borderRadius: 2, height: "100%" }}>
                        <CardContent>
                            <ReportProblemIcon fontSize="large" />
                            <Typography variant="h6">Incidencias abiertas</Typography>
                            <Typography variant="h5">{data.incidenciasAbiertas}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Bloque del gráfico separado y alineado */}
            <div style={{ marginTop: "40px" }}>
                <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                    <CardContent>
                        <Bar data={chartData} options={chartOptions} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Home;
