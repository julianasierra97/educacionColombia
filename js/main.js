const _dataUrl = "https://www.datos.gov.co/resource/y9ga-zwzy.json";
const _dataUrlDepartamentos = "https://www.datos.gov.co/resource/xdk5-pm3f.json";





const getData = (url1, url2) => {

    const requestOne = axios.get(url1);
    const requestTwo = axios.get(url2);

    axios.all([requestOne, requestTwo]).then(axios.spread((...responses) => {
        const responseOne = responses[0]
        const responseTwo = responses[1]
        const  dataEducacion = responseOne.data;
        const dataEducacionSinMunicipiosDuplicados =  Array.from(new Set(dataEducacion.map(a => a['c_digo_delmunicipio'])))
            .map(id => {
                return dataEducacion.find(a => a['c_digo_delmunicipio'] === id)
            })
        const dataDepartamentos = responseTwo.data.map(({region, c_digo_dane_del_municipio, municipio, ...keepAttrs}) => keepAttrs)
        const codigosDepartamentos = Array.from(new Set(dataDepartamentos.map(a => a['c_digo_dane_del_departamento'])))
            .map(id => {
                return dataDepartamentos.find(a => a['c_digo_dane_del_departamento'] === id)
            })

        const mergedData = dataEducacionSinMunicipiosDuplicados.map(t1 => ({...t1, ...codigosDepartamentos.find(t2 => t2['c_digo_dane_del_departamento'] === t1['c_digo_deldepartamento'])}))


        const doctoradosEnDepartamentos = mergedData.reduce((l, c) => {
            l[c.c_digo_dane_del_departamento] = +c.doctorado + (l[c.c_digo_dane_del_departamento]||0)
            return l
        })


        const doctoradosEnDepartamentosObject = Object.keys(doctoradosEnDepartamentos).map((value) => ({
            Departamento: value, Doctorado: +doctoradosEnDepartamentos[value]
        }))


        console.log(doctoradosEnDepartamentosObject);
        const especializacionEnDepartamentos = mergedData.reduce((l, c) => {
            l[c.c_digo_dane_del_departamento] = +c.especializacion + (l[c.c_digo_dane_del_departamento]||0)
            return l
        })

        const especializacionEnDepartamentosObject = Object.keys(especializacionEnDepartamentos).map((value) => ({
            Departamento: value, Especializacion: +especializacionEnDepartamentos[value]
        }))

        const maestriaEnDepartamentos = mergedData.reduce((l, c) => {
            l[c.c_digo_dane_del_departamento] = +c.maestria + (l[c.c_digo_dane_del_departamento]||0)
            return l
        })

        const maestriaEnDepartamentosObject = Object.keys(maestriaEnDepartamentos).map((value) => ({
            Departamento: value, Maestria: +maestriaEnDepartamentos[value]
        }))

        const tecnica_profesionalEnDepartamentos = mergedData.reduce((l, c) => {
            l[c.c_digo_dane_del_departamento] = +c.tecnica_profesional + (l[c.c_digo_dane_del_departamento]||0)
            return l
        })

        const tecnica_profesionalEnDepartamentosObject = Object.keys(tecnica_profesionalEnDepartamentos).map((value) => ({
            Departamento: value, "Tecnica profesional": +tecnica_profesionalEnDepartamentos[value]
        }))



        const dataVisualizacion = codigosDepartamentos
            .map(t1 => ({...t1, ...doctoradosEnDepartamentosObject.find(t2 => t2['Departamento'] === t1['c_digo_dane_del_departamento'])}))
            .map(t1 => ({...t1, ...especializacionEnDepartamentosObject.find(t2 => t2['Departamento'] === t1['c_digo_dane_del_departamento'])}))
            .map(t1 => ({...t1, ...maestriaEnDepartamentosObject.find(t2 => t2['Departamento'] === t1['c_digo_dane_del_departamento'])}))
            .map(t1 => ({...t1, ...tecnica_profesionalEnDepartamentosObject.find(t2 => t2['Departamento'] === t1['c_digo_dane_del_departamento'])}))
            .filter(x => {
                return x['c_digo_dane_del_departamento'] !== '76'
                    & x['c_digo_dane_del_departamento'] !== '94'
                    & x['c_digo_dane_del_departamento'] !== '81'
                    & x['c_digo_dane_del_departamento'] !== '88'
                    & x['c_digo_dane_del_departamento'] !== '54'
                    & x['c_digo_dane_del_departamento'] !== '11'
                    & x['c_digo_dane_del_departamento'] !== '99'

            })
        const dataBogota = dataEducacionSinMunicipiosDuplicados.find(value => value['c_digo_deldepartamento'] === '11')
        console.log(dataBogota)
        const objBogota = {
            Departamento: dataBogota['c_digo_deldepartamento'],
            departamento: "Bogota D.C",
            Maestria: dataBogota['maestria'],
            "Tecnica profesional": dataBogota['tecnica_profesional'],
            Doctorado: dataBogota['doctorado'],
            Especializacion: dataBogota['especializacion']
        }

        dataVisualizacion.push(objBogota);

        console.log(dataVisualizacion);

        viz(dataVisualizacion);

    })).catch(errors => {
        console.log(errors)
    })



    const viz = (data) => {

        const width = 1300
        const height = 700
        const margin = {
            top:150,
            right: 5,
            bottom: 50,
            left:30
        }

        svg = d3.select(".dataviz > svg")
            .attr("id", "viz").attr("viewBox", [0,0,width,height])


        const groupKey = "departamento"
        const keys = ["Tecnica profesional", "Maestria", "Especializacion", "Doctorado"]


        const x0 = d3.scaleBand()
            .domain(data.map(d => d[groupKey]))
            .rangeRound([margin.left, width - margin.right])

        const x1 = d3.scaleBand()
            .domain(keys)
            .rangeRound([0, x0.bandwidth()])
            .padding(0.01)

        const y = d3.scaleLinear()
            .domain([0, 60000])
            .rangeRound([height - margin.bottom, margin.top])


        const color = d3.scaleOrdinal()
            .range([ "#8a89a6",  "#6b486b", "#a05d56", "#d0743c"])

        xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x0).tickSizeOuter(0))
            .call(g => g.select(".domain").remove())


        yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(null, "s"))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", 3)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(data.y))

        svg.append("g")
            .selectAll("g")
            .data(data)
            .join("g")
            .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
            .selectAll("rect")
            .data(d => keys.map(key => ({key, value: d[key]})))
            .join("rect")
            .attr("x", d => x1(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => y(0) - y(d.value))
            .attr("fill", d => color(d.key));

        legend = svg => {
            const g = svg
                .attr("transform", `translate(${width},0)`)
                .attr("text-anchor", "end")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .selectAll("g")
                .data(color.domain().slice().reverse())
                .join("g")
                .attr("transform", (d, i) => `translate(0,${i * 20})`);

            g.append("rect")
                .attr("x", -19)
                .attr("width", 19)
                .attr("height", 19)
                .attr("fill", color);

            g.append("text")
                .attr("x", -24)
                .attr("y", 9.5)
                .attr("dy", "0.35em")
                .text(d => d);
        }

        svg.append("g")
            .call(xAxis);

        svg.append("g")
            .call(yAxis);

        svg.append("g")
            .call(legend);


    }
}

getData(_dataUrl, _dataUrlDepartamentos);

