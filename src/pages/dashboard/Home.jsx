import AssignmentIcon from "@mui/icons-material/Assignment";
import DevicesIcon from "@mui/icons-material/Devices";
import PeopleIcon from "@mui/icons-material/People";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    Title,
    Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import AsyncSelect from "react-select/async";
import { buscarDispositivosSelect, getAnios, getDashboard } from "../../services/api";



ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Home() {
    const [data, setData] = useState(null);
    const [anios, setAnios] = useState([]);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [dispositivo, setDispositivo] = useState(null);

    useEffect(() => {
        getAnios()
            .then((data) => {
                setAnios(data);
                if (data.length > 0) setAnio(data[0]); // año más reciente
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (!anio) return;

        setData(null);

        getDashboard({
            anio,
            idDispositivo: dispositivo?.value || null
        })
            .then(setData)
            .catch(err => console.error(err));

    }, [anio, dispositivo]);

    const consumosOrdenados = useMemo(() => {
        return data?.consumosMensuales
            ? [...data.consumosMensuales].sort((a, b) => a.mesNumero - b.mesNumero)
            : [];
    }, [data]);

    const chartData = useMemo(() => ({
        labels: consumosOrdenados.map(c => c.mes),
        datasets: [
            {
                label: "Mono",
                data: consumosOrdenados.map(c => c.totalMono),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
            },
            {
                label: "Color",
                data: consumosOrdenados.map(c => c.totalColor),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
            }
        ],
    }), [consumosOrdenados]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false, // permite altura y ancho personalizados
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Consumos Mensuales" },
        },
        scales: {
            y: { beginAtZero: true },
            x: { ticks: { maxRotation: 0, minRotation: 0 } } // evita que las etiquetas de meses se giren
        }
    }), []);

    return (
        <div style={{ padding: "20px" }}>

            <Typography
                variant="h2"
                gutterBottom
                sx={{ mt: 4, color: "primary.main", fontWeight: "bold", textAlign: "center" }}
            >
                Dashboard
            </Typography>


            {!data ? (
                <Typography>Cargando...</Typography>
            ) : (
                <>

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

                    {/* ESTO SIEMPRE SE DEBE VER */}
                    <Grid container spacing={3} alignItems="center" sx={{ my: 4 }} >
                        <Grid item>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Año</InputLabel>
                                <Select
                                    value={anio}
                                    label="Año"
                                    onChange={(e) => {
                                        setAnio(e.target.value);
                                        setDispositivo(null); // reset filtro
                                    }}
                                >
                                    {anios.map(a => (
                                        <MenuItem key={a} value={a}>
                                            {a}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item>
                            <AsyncSelect
                                cacheOptions
                                defaultOptions
                                loadOptions={(inputValue) =>
                                    new Promise((resolve) => {
                                        setTimeout(async () => {
                                            const opciones = await buscarDispositivosSelect(inputValue, 1, 50);

                                            const filtrados = opciones.filter(o =>
                                                o.nombreCategoria &&
                                                o.nombreCategoria.toLowerCase().includes("impresora")
                                            );

                                            resolve(filtrados);
                                        }, 300); // pequeño delay
                                    })
                                }
                                value={dispositivo}
                                onChange={(opcion) => setDispositivo(opcion)}
                                placeholder="Filtrar por dispositivo..."
                                isClearable
                                styles={{ container: base => ({ ...base, width: 300 }) }}
                            />

                        </Grid>
                    </Grid>

                    {/* Bloque del gráfico separado y alineado */}
                    <Grid container justifyContent="center" sx={{ mt: 4 }}>
                        <Grid item xs={12} md={10} lg={9}>
                            <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
                                <CardContent>
                                    <div style={{ height: "350px", width: "80vw", margin: "0 auto" }}>
                                        <Bar data={chartData} options={chartOptions} />
                                    </div>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </div>
    );
}

export default Home;
